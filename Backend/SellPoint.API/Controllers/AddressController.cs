using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SellPoint.API.Models;
using SellPoint.API.Services;
using System.Security.Claims;

namespace SellPoint.API.Controllers
{
    [Route("api/[controller]es")]
    [ApiController]
    [Authorize]
    public class AddressController : ControllerBase
    {
        private readonly DatabaseService _databaseService;

        public AddressController(DatabaseService databaseService)
        {
            _databaseService = databaseService;
        }

        private async Task<int> GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAddresses()
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var addresses = await _databaseService.GetUserAddresses(userId);
                return Ok(addresses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get addresses", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddAddress([FromBody] AddressModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var addressId = await _databaseService.AddAddress(userId, model);
                return Ok(new { addressId, message = "Address added successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to add address", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] AddressModel model)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.UpdateAddress(id, userId, model);
                return result ? Ok(new { message = "Address updated successfully" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update address", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            try
            {
                var userId = await GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _databaseService.DeleteAddress(id, userId);
                return result ? Ok(new { message = "Address deleted successfully" }) : NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete address", error = ex.Message });
            }
        }
    }
}