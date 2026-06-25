using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Models;
using SellPoint.API.Services;
using System.Security.Claims;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public CartController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var items = await _databaseService.GetCartItems(userId);
                return Ok(new { items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get cart", error = ex.Message });
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetCartSummary()
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var summary = await _databaseService.GetCartTotal(userId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get cart summary", error = ex.Message });
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.AddToCart(userId, model.ProductId, model.Quantity);
                return Ok(new { success = result > 0, message = "Item added to cart" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to add to cart", error = ex.Message });
            }
        }

        [HttpPut("{cartId}")]
        public async Task<IActionResult> UpdateCartQuantity(int cartId, [FromBody] UpdateCartModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.UpdateCartQuantity(cartId, userId, model.Quantity);
                return Ok(new { success = result > 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update quantity", error = ex.Message });
            }
        }

        [HttpDelete("{cartId}")]
        public async Task<IActionResult> RemoveFromCart(int cartId)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.RemoveFromCart(cartId, userId);
                return Ok(new { success = result > 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to remove item", error = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.ClearCart(userId);
                return Ok(new { success = result > 0 });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to clear cart", error = ex.Message });
            }
        }
    }
}