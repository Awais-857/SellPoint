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
    public class VendorController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public VendorController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // ========== Product Management ==========
        [HttpGet("products")]
        public async Task<IActionResult> GetVendorProducts()
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var products = await _databaseService.GetVendorProducts(vendorId);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get products", error = ex.Message });
            }
        }

        [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductModel model)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var productId = await _databaseService.CreateProduct(vendorId, model);
                return Ok(new { productId, message = "Product created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create product", error = ex.Message });
            }
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductModel model)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var result = await _databaseService.UpdateProduct(id, vendorId, model);
                return result ? Ok(new { message = "Product updated successfully" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update product", error = ex.Message });
            }
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var result = await _databaseService.DeleteProduct(id, vendorId);
                return result ? Ok(new { message = "Product deleted successfully" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete product", error = ex.Message });
            }
        }

        [HttpPut("products/{id}/toggle-status")]
        public async Task<IActionResult> ToggleProductStatus(int id)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var result = await _databaseService.ToggleProductStatus(id, vendorId);
                return result ? Ok(new { message = "Product status updated" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update product status", error = ex.Message });
            }
        }

        // ========== Order Management ==========
        [HttpGet("orders")]
        public async Task<IActionResult> GetVendorOrders([FromQuery] string? status = null)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var orders = await _databaseService.GetVendorOrders(vendorId, status);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get orders", error = ex.Message });
            }
        }

        [HttpPut("orders/{orderItemId}/status")]
        public async Task<IActionResult> UpdateOrderItemStatus(int orderItemId, [FromBody] UpdateStatusModel model)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var result = await _databaseService.UpdateOrderItemStatus(orderItemId, vendorId, model.Status);
                return result ? Ok(new { message = "Order status updated" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update status", error = ex.Message });
            }
        }

        // ========== Revenue Dashboard ==========
        [HttpGet("revenue/summary")]
        public async Task<IActionResult> GetRevenueSummary()
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var summary = await _databaseService.GetVendorRevenueSummary(vendorId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get revenue summary", error = ex.Message });
            }
        }

        [HttpGet("revenue/transactions")]
        public async Task<IActionResult> GetRecentTransactions([FromQuery] int limit = 10)
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var transactions = await _databaseService.GetVendorTransactions(vendorId, limit);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get transactions", error = ex.Message });
            }
        }

        [HttpGet("revenue/chart")]
        public async Task<IActionResult> GetRevenueChart([FromQuery] string period = "monthly")
        {
            try
            {
                var vendorId = await GetCurrentUserId();
                if (vendorId == 0 || User.FindFirst("userType")?.Value != "Vendor")
                    return Unauthorized();

                var chartData = await _databaseService.GetVendorRevenueChart(vendorId, period);
                return Ok(chartData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get chart data", error = ex.Message });
            }
        }
    }
}