using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Services;
using System.Security.Claims;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public ProfileController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "Invalid user token" });

                var profile = await _databaseService.GetUserProfile(userId);
                return profile == null ? NotFound(new { message = "Profile not found" }) : Ok(profile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get profile", error = ex.Message });
            }
        }
    }
}