using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SellPoint.API.Models;
using SellPoint.API.Services;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly DatabaseService _databaseService;
        private readonly IConfiguration _configuration;

        public AdminController(DatabaseService databaseService, IConfiguration configuration)
        {
            _databaseService = databaseService;
            _configuration = configuration;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // ========== Vendor Management ==========

        // GET: api/admin/vendors
        [HttpGet("vendors")]
        public async Task<IActionResult> GetAllVendors([FromQuery] string? status = null)
        {
            try
            {
                var vendors = await _databaseService.GetAllVendors(status);
                return Ok(vendors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get vendors", error = ex.Message });
            }
        }

        // GET: api/admin/reviews/pending
[HttpGet("reviews/pending")]
public async Task<IActionResult> GetPendingReviews()
{
    try
    {
        var reviews = await _databaseService.GetPendingReviews();
        return Ok(reviews);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to get pending reviews", error = ex.Message });
    }
}

// PUT: api/admin/reviews/{reviewId}/approve
[HttpPut("reviews/{reviewId}/approve")]
public async Task<IActionResult> ApproveReview(int reviewId)
{
    try
    {
        var result = await _databaseService.ApproveReview(reviewId);
        if (result)
            return Ok(new { message = "Review approved successfully" });
        else
            return NotFound(new { message = "Review not found" });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to approve review", error = ex.Message });
    }
}

        // POST: api/admin/vendors/approve
        [HttpPost("vendors/approve")]
        public async Task<IActionResult> ApproveVendor([FromBody] ApproveVendorModel model)
        {
            try
            {
                // Validate input
                if (model.UserID <= 0)
                {
                    return BadRequest(new { message = "Invalid vendor ID" });
                }

                var adminId = await GetCurrentUserId();
                if (adminId == 0)
                {
                    return Unauthorized(new { message = "Admin not found" });
                }

                var result = await _databaseService.UpdateVendorApproval(model.UserID, adminId, "Approved", null);

                if (result)
                {
                    return Ok(new { success = true, message = "Vendor approved successfully!" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to approve vendor. Vendor may not exist." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to approve vendor", error = ex.Message });
            }
        }

        // POST: api/admin/vendors/reject
        [HttpPost("vendors/reject")]
        public async Task<IActionResult> RejectVendor([FromBody] ApproveVendorModel model)
        {
            try
            {
                if (model.UserID <= 0)
                {
                    return BadRequest(new { message = "Invalid vendor ID" });
                }

                if (string.IsNullOrEmpty(model.RejectionReason))
                {
                    return BadRequest(new { message = "Rejection reason is required" });
                }

                var adminId = await GetCurrentUserId();
                if (adminId == 0)
                {
                    return Unauthorized(new { message = "Admin not found" });
                }

                var result = await _databaseService.UpdateVendorApproval(model.UserID, adminId, "Rejected", model.RejectionReason);

                if (result)
                {
                    return Ok(new { success = true, message = "Vendor rejected successfully!" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to reject vendor" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to reject vendor", error = ex.Message });
            }
        }

        // PUT: api/admin/vendors/{userId}/toggle-status
        [HttpPut("vendors/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleVendorStatus(int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { message = "Invalid user ID" });
                }

                var result = await _databaseService.ToggleUserStatus(userId);

                if (result)
                {
                    return Ok(new { success = true, message = "Vendor status updated successfully" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Vendor not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update vendor status", error = ex.Message });
            }
        }

        // GET: api/admin/vendors/pending
        [HttpGet("vendors/pending")]
        public async Task<IActionResult> GetPendingVendors()
        {
            try
            {
                var vendors = await _databaseService.GetPendingVendors();
                return Ok(vendors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get pending vendors", error = ex.Message });
            }
        }

        // ========== Category Management ==========
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories([FromQuery] int? parentId = null, [FromQuery] bool includeInactive = false)
        {
            try
            {
                var categories = await _databaseService.GetCategories(parentId, includeInactive);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get categories", error = ex.Message });
            }
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryModel model)
        {
            try
            {
                // Log the incoming request
                Console.WriteLine($"CreateCategory called with: Name={model.CategoryName}, ParentId={model.ParentCategoryId}");

                // Validate input
                if (string.IsNullOrWhiteSpace(model.CategoryName))
                {
                    return BadRequest(new { message = "Category name is required" });
                }

                var categoryId = await _databaseService.CreateCategory(model);

                Console.WriteLine($"Category created successfully with ID: {categoryId}");

                return Ok(new { categoryId, message = "Category created successfully" });
            }
            catch (SqlException sqlEx)
            {
                Console.WriteLine($"SQL Exception: {sqlEx.Number} - {sqlEx.Message}");

                if (sqlEx.Number == 2627) // Duplicate key error
                {
                    return BadRequest(new { message = "A category with this name already exists" });
                }
                return StatusCode(500, new { message = "Database error", error = sqlEx.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");

                return StatusCode(500, new { message = "Failed to create category", error = ex.Message });
            }
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryModel model)
        {
            try
            {
                Console.WriteLine($"=== UpdateCategory Debug ===");
                Console.WriteLine($"ID received: {id}");
                Console.WriteLine($"CategoryName: {model?.CategoryName}");
                Console.WriteLine($"Description: {model?.Description}");
                Console.WriteLine($"ParentCategoryId: {model?.ParentCategoryId}");
                Console.WriteLine($"IsActive: {model?.IsActive}");
                Console.WriteLine($"ImageUrl: {model?.ImageUrl}");

                if (model == null)
                {
                    return BadRequest(new { message = "Invalid category data" });
                }

                if (string.IsNullOrWhiteSpace(model.CategoryName))
                {
                    return BadRequest(new { message = "Category name is required" });
                }

                var result = await _databaseService.UpdateCategory(id, model);

                if (result)
                {
                    return Ok(new { success = true, message = "Category updated successfully" });
                }
                else
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateCategory: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Failed to update category", error = ex.Message });
            }
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var result = await _databaseService.DeleteCategory(id);
                return result ? Ok(new { message = "Category deleted successfully" }) : BadRequest(new { message = "Cannot delete category with active products" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete category", error = ex.Message });
            }
        }

        [HttpPut("categories/{id}/toggle-status")]
        public async Task<IActionResult> ToggleCategoryStatus(int id)
        {
            try
            {
                var result = await _databaseService.ToggleCategoryStatus(id);
                return result ? Ok(new { message = "Category status updated" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update category status", error = ex.Message });
            }
        }

        // ========== Reports ==========
        [HttpGet("reports/sales")]
        public async Task<IActionResult> GetSalesReport(
            [FromQuery] string type = "daily",
            [FromQuery] string? fromDate = null,
            [FromQuery] string? toDate = null)
        {
            try
            {
                var report = await _databaseService.GetSalesReport(type, fromDate, toDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get sales report", error = ex.Message });
            }
        }

        [HttpGet("reports/top-vendors")]
        public async Task<IActionResult> GetTopVendors(
            [FromQuery] string? fromDate = null,
            [FromQuery] string? toDate = null,
            [FromQuery] int topN = 5)
        {
            try
            {
                var vendors = await _databaseService.GetTopVendors(fromDate, toDate, topN);
                return Ok(vendors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get top vendors", error = ex.Message });
            }
        }

        [HttpGet("reports/top-products")]
        public async Task<IActionResult> GetTopProducts(
            [FromQuery] string? fromDate = null,
            [FromQuery] string? toDate = null,
            [FromQuery] int topN = 5)
        {
            try
            {
                var products = await _databaseService.GetTopProducts(fromDate, toDate, topN);
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get top products", error = ex.Message });
            }
        }

        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _databaseService.GetDashboardStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get dashboard stats", error = ex.Message });
            }
        }

        [HttpGet("public/categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicCategories()
        {
            try
            {
                var categories = await _databaseService.GetCategories(null, false);
                var activeCategories = categories.Where(c => c.IsActive).ToList();
                return Ok(activeCategories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get categories", error = ex.Message });
            }
        }

        // ========== Order Management ==========
[HttpGet("orders")]
public async Task<IActionResult> GetAllOrders(
    [FromQuery] string? status = null,
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50)
{
    try
    {
        var orders = await _databaseService.GetAllOrders(status, fromDate, toDate, page, pageSize);
        return Ok(orders);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to get orders", error = ex.Message });
    }
}

[HttpGet("orders/{id}")]
public async Task<IActionResult> GetAdminOrderDetail(int id)
{
    try
    {
        var order = await _databaseService.GetAdminOrderDetail(id);
        return order == null ? NotFound() : Ok(order);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to get order details", error = ex.Message });
    }
}

// ========== Dispute Management ==========
[HttpGet("disputes")]
public async Task<IActionResult> GetAllDisputes([FromQuery] string? status = null)
{
    try
    {
        var disputes = await _databaseService.GetAllDisputes(status);
        return Ok(disputes);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to get disputes", error = ex.Message });
    }
}

[HttpPost("disputes/resolve/{disputeId}")]
public async Task<IActionResult> ResolveDispute(int disputeId, [FromBody] ResolveDisputeModel model)
{
    try
    {
        var result = await _databaseService.ResolveDispute(disputeId, model);
        return result ? Ok(new { message = "Dispute resolved successfully" }) : BadRequest(new { message = "Failed to resolve dispute" });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to resolve dispute", error = ex.Message });
    }
}
    }
}