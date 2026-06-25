using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace SellPoint.API.Middleware
{
    public class SuspensionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public SuspensionMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip for login, register, and public endpoints
            var path = context.Request.Path.Value?.ToLower();
            if (path.Contains("/auth/login") ||
                path.Contains("/auth/register") ||
                path.Contains("/products") ||
                path.Contains("/categories"))
            {
                await _next(context);
                return;
            }

            // Check if user is authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out int userId))
                {
                    // Check if user is still active
                    using (SqlConnection conn = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
                    {
                        using (SqlCommand cmd = new SqlCommand("SELECT IsActive FROM Users WHERE UserID = @UserID", conn))
                        {
                            cmd.Parameters.AddWithValue("@UserID", userId);
                            await conn.OpenAsync();
                            var isActive = (bool?)await cmd.ExecuteScalarAsync();

                            if (isActive.HasValue && !isActive.Value)
                            {
                                context.Response.StatusCode = 403;
                                await context.Response.WriteAsJsonAsync(new { message = "Your account has been suspended. Please contact support." });
                                return;
                            }
                        }
                    }
                }
            }

            await _next(context);
        }
    }
}