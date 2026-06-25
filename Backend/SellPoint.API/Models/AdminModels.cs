using System.ComponentModel.DataAnnotations;

namespace SellPoint.API.Models
{
    public class ApproveVendorModel
    {
        [Required]
        public int UserID { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class AdminProfile
    {
        public int AdminProfileID { get; set; }
        public int UserID { get; set; }
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public string[] Permissions { get; set; } = new string[] { "manage_vendors", "manage_categories", "view_reports" };
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
    public class AdminVendor
    {
        public int UserId { get; set; }
        public string BusinessName { get; set; }
        public string OwnerName { get; set; }
        public string Email { get; set; }
        public string TaxId { get; set; }
        public string? BusinessPhone { get; set; }
        public string ApprovalStatus { get; set; }
        public DateTime RegisteredDate { get; set; }
        public bool IsActive { get; set; }
    }
}