using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Services;
using System.Security.Claims;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]s")]
    [ApiController]
    [Authorize]
    public class ReviewController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public ReviewController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // POST: api/reviews
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.AddReview(userId, model.ProductId, model.OrderItemId, model.Rating, model.Comment);
                if (result.Success)
                    return Ok(new { message = result.Message, reviewId = result.ReviewId });
                else
                    return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to add review", error = ex.Message });
            }
        }
    }

    public class CreateReviewModel
    {
        public int ProductId { get; set; }
        public int OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}