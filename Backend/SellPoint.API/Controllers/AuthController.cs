using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using SellPoint.API.Models;
using SellPoint.API.Services;
using System.Security.Claims;
using System.Text;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DatabaseService _databaseService;
        private readonly IConfiguration _configuration;

        public AuthController(DatabaseService databaseService, IConfiguration configuration)
        {
            _databaseService = databaseService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            try
            {
                var exists = await _databaseService.CheckUserExists(model.Username, model.Email);
                if (exists.UsernameExists) return BadRequest(new { message = "Username already exists" });
                if (exists.EmailExists) return BadRequest(new { message = "Email already exists" });
        
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.Password);
                int userId = await _databaseService.RegisterUser(model, hashedPassword);
        
                switch (model.UserType)
                {
                    case "Vendor":
                        if (string.IsNullOrEmpty(model.BusinessName) || string.IsNullOrEmpty(model.TaxID))
                            return BadRequest(new { message = "Business Name and Tax ID are required for vendors" });
                        var (vendorProfileId, uploadToken) = await _databaseService.CreateVendorProfile(userId, model);
                        return Ok(new
                        {
                            message = "Registration successful!",
                            userId,
                            userType = model.UserType,
                            uploadToken = uploadToken
                        });
                    case "Admin":
                        await _databaseService.CreateAdminProfile(userId, model);
                        break;
                    default:
                        await _databaseService.CreateCustomerProfile(userId);
                        break;
                }
        
                return Ok(new { message = "Registration successful!", userId, userType = model.UserType });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Registration failed", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                var user = await _databaseService.ValidateUser(model.UsernameOrEmail);
                if (user == null) return BadRequest(new { message = "Invalid username or email" });
                if (user.IsLocked) return BadRequest(new { message = "Account is locked. Please reset your password." });
                if (!user.IsActive)
                {
                    return BadRequest(new { message = "Your account has been suspended. Please contact support." });
                }

                // ========== VENDOR APPROVAL CHECK ==========
                // If user is a vendor, check if their profile is approved
                if (user.UserType == "Vendor")
                {
                    var vendorProfile = await _databaseService.GetVendorProfile(user.UserID);
                    if (vendorProfile == null || vendorProfile.ApprovalStatus != "Approved")
                    {
                        return BadRequest(new { message = "Your vendor account is pending admin approval. You will be notified once approved." });
                    }
                }
                // ===========================================

                bool validPassword = BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash);
                if (!validPassword)
                {
                    await _databaseService.UpdateLoginFailure(model.UsernameOrEmail,
                        HttpContext.Connection.RemoteIpAddress?.ToString(),
                        Request.Headers["User-Agent"].ToString());
                    return BadRequest(new { message = "Invalid password" });
                }

                await _databaseService.UpdateLoginSuccess(user.UserID,
                    HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Request.Headers["User-Agent"].ToString());

                var token = GenerateJwtToken(user);
                return Ok(new LoginResponse { Token = token, Username = user.Username, Email = user.Email, UserType = user.UserType, UserId = user.UserID });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Login failed", error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            try
            {
                string resetToken = Guid.NewGuid().ToString();
                var userId = await _databaseService.RequestPasswordReset(model.Email, resetToken);
                if (userId.HasValue)
                    return Ok(new { message = "Password reset link sent!", resetToken });
                else
                    return BadRequest(new { message = "Email not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to process request", error = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            try
            {
                var userId = await _databaseService.ValidateResetToken(model.Token);
                if (!userId.HasValue) return BadRequest(new { message = "Invalid or expired reset token" });

                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
                var result = await _databaseService.ResetPassword(model.Token, hashedPassword);

                return result ? Ok(new { message = "Password reset successful!" }) : BadRequest(new { message = "Failed to reset password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Password reset failed", error = ex.Message });
            }
        }

        [HttpGet("test")]
        public IActionResult Test() => Ok(new { message = "API is working!" });
        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JsonWebTokenHandler();
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
            var key = Encoding.ASCII.GetBytes(jwtKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.UserType),  // IMPORTANT: This is for role-based auth
            new Claim("userType", user.UserType),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        }),
                Expires = DateTime.UtcNow.AddHours(Convert.ToInt32(_configuration["Jwt:ExpiryInHours"] ?? "24")),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            };
            return tokenHandler.CreateToken(tokenDescriptor);
        }
    }
}