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
    public class DocumentController : ControllerBase
    {
        private readonly DatabaseService _databaseService;
        private readonly IWebHostEnvironment _environment;

        public DocumentController(DatabaseService databaseService, IWebHostEnvironment environment)
        {
            _databaseService = databaseService;
            _environment = environment;
        }

        // POST: api/document/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentModel model)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                if (model.File == null || model.File.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                // Validate file size (max 5MB)
                if (model.File.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { message = "File size exceeds 5MB limit" });
                }

                // Validate file type
                var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
                if (!allowedTypes.Contains(model.File.ContentType))
                {
                    return BadRequest(new { message = "Only PDF, JPEG, and PNG files are allowed" });
                }

                // Create directory if it doesn't exist
                string uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "vendors", userId.ToString());
                Directory.CreateDirectory(uploadsFolder);

                // Generate unique filename
                string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(model.File.FileName)}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await model.File.CopyToAsync(fileStream);
                }

                // Save to database
                string dbPath = $"/uploads/vendors/{userId}/{uniqueFileName}";
                int documentId = await _databaseService.UploadVendorDocument(
                    userId,
                    model.DocumentType,
                    model.File.FileName,
                    dbPath,
                    (int)model.File.Length,
                    model.File.ContentType
                );

                return Ok(new
                {
                    message = "Document uploaded successfully",
                    documentId = documentId,
                    filePath = dbPath
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to upload document", error = ex.Message });
            }
        }

        [HttpPost("temp-upload")]
[AllowAnonymous]
public async Task<IActionResult> TempUpload([FromForm] int userId, [FromForm] string token, [FromForm] string documentType, IFormFile file)
{
    try
    {
        // Validate token and pending status
        var isValid = await _databaseService.ValidateVendorUploadToken(userId, token);
        if (!isValid)
            return BadRequest(new { message = "Invalid or expired upload token" });

        // Validate file
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size exceeds 5MB limit" });

        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Only PDF, JPEG, and PNG files are allowed" });

        // Create directory if it doesn't exist
        string uploadsFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "vendors", userId.ToString());
        Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename and save
        string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        string filePath = Path.Combine(uploadsFolder, uniqueFileName);
        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        string dbPath = $"/uploads/vendors/{userId}/{uniqueFileName}";
        int documentId = await _databaseService.UploadVendorDocument(
            userId, documentType, file.FileName, dbPath, (int)file.Length, file.ContentType);

        return Ok(new { documentId, message = "Document uploaded successfully", filePath = dbPath });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Upload failed", error = ex.Message });
    }
}

        // GET: api/document/my-documents
        [HttpGet("my-documents")]
        public async Task<IActionResult> GetMyDocuments()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var documents = await _databaseService.GetVendorDocuments(userId);
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get documents", error = ex.Message });
            }
        }
    }
}