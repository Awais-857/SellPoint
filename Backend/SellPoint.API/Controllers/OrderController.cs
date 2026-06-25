using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Models;
using SellPoint.API.Services;
using System.Security.Claims;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]s")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public OrderController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        private string GetCurrentUserType()
        {
            return User.FindFirst("userType")?.Value ?? "Customer";
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            try
            {
                var userId = await GetCurrentUserId();
                var userType = GetCurrentUserType();
                if (userId == 0) return Unauthorized();

                object orders;
                if (userType == "Vendor")
                    orders = await _databaseService.GetVendorOrders(userId, status);
                else
                    orders = await _databaseService.GetCustomerOrders(userId, status);

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get orders", error = ex.Message });
            }
        }

        // GET: api/orders/{id}/tracking
[HttpGet("{id}/tracking")]
public async Task<IActionResult> GetOrderTracking(int id)
{
    try
    {
        var userId = await GetCurrentUserId();
        var userType = GetCurrentUserType();
        if (userId == 0) return Unauthorized();

        var tracking = await _databaseService.GetOrderTrackingInfo(id, userId, userType);
        return tracking == null ? NotFound() : Ok(tracking);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to get tracking info", error = ex.Message });
    }
}

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            try
            {
                var userId = await GetCurrentUserId();
                var userType = GetCurrentUserType();
                if (userId == 0) return Unauthorized();

                var order = await _databaseService.GetOrderById(id, userId, userType);
                return order == null ? NotFound(new { message = "Order not found" }) : Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get order", error = ex.Message });
            }
        }

        [HttpGet("{id}/items")]
        public async Task<IActionResult> GetOrderItems(int id)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var items = await _databaseService.GetOrderItems(id);
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get order items", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var orderId = await _databaseService.CreateOrder(userId, model);
                return Ok(new { orderId, message = "Order placed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create order", error = ex.Message });
            }
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.CancelOrder(id, userId);
                return result ? Ok(new { message = "Order cancelled successfully" }) : BadRequest(new { message = "Cannot cancel order" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to cancel order", error = ex.Message });
            }
        }

        [HttpPost("{id}/reorder")]
        public async Task<IActionResult> Reorder(int id)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.Reorder(id, userId);
                return result ? Ok(new { success = true, message = "Items added to cart" }) : BadRequest();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to reorder", error = ex.Message });
            }
        }

        [HttpPost("{orderId}/dispute")]
public async Task<IActionResult> CreateDispute(int orderId, [FromBody] CreateDisputeModel model)
{
    try
    {
        var userId = await GetCurrentUserId();
        if (userId == 0) return Unauthorized();
        var userType = GetCurrentUserType();

        // Verify order belongs to this user
        var order = await _databaseService.GetOrderById(orderId, userId, userType);
        if (order == null) return BadRequest(new { message = "Order not found or unauthorized" });

        model.OrderId = orderId;
        model.UserType = userType;
        var disputeId = await _databaseService.CreateDispute(userId, model);
        return Ok(new { disputeId, message = "Dispute raised successfully" });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to raise dispute", error = ex.Message });
    }
}
    }
}