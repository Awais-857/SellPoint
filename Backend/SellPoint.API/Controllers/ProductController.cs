using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Models;
using SellPoint.API.Services;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]s")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public ProductController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? categoryId,
            [FromQuery] int? vendorId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortBy = "CreatedDate",
            [FromQuery] string? sortOrder = "DESC",
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _databaseService.GetProducts(
                    categoryId, vendorId, minPrice, maxPrice,
                    searchTerm, sortBy, sortOrder, pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get products", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductById(int id)
        {
            try
            {
                var product = await _databaseService.GetProductById(id);
                return product == null ? NotFound() : Ok(product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get product", error = ex.Message });
            }
        }

        [HttpGet("{id}/reviews")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductReviews(int id, [FromQuery] bool onlyApproved = true)
        {
            try
            {
                var reviews = await _databaseService.GetProductReviews(id, onlyApproved);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get reviews", error = ex.Message });
            }
        }
        // Add this inside ProductController class
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new { message = "ProductController is working!", timestamp = DateTime.Now });
        }
    }
}