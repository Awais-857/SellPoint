using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Models;
using SellPoint.API.Services;

namespace SellPoint.API.Controllers
{
    [ApiController]
    [Route("api/[controller]s")]
    public class CategoryController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public CategoryController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        // GET: api/categories
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                Console.WriteLine("CategoryController.GetAllCategories called");
                var categories = await _databaseService.GetCategories(null, false);
                Console.WriteLine($"Found {categories.Count} categories");
                return Ok(categories);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllCategories: {ex.Message}");
                return StatusCode(500, new { message = "Failed to get categories", error = ex.Message });
            }
        }

        // GET: api/categories/active
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveCategories()
        {
            try
            {
                var categories = await _databaseService.GetCategories(null, false);
                var activeCategories = categories.Where(c => c.IsActive).ToList();
                return Ok(activeCategories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get active categories", error = ex.Message });
            }
        }

        // GET: api/categories/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            try
            {
                var category = await _databaseService.GetCategoryById(id);
                if (category == null)
                {
                    return NotFound(new { message = "Category not found" });
                }
                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get category", error = ex.Message });
            }
        }
    }
}