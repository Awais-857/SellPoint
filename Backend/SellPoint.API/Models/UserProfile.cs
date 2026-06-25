namespace SellPoint.API.Models
{
    public class UserProfile
    {
        // Basic User Info
        public int UserID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string UserType { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }

        // Customer Profile
        public int? LoyaltyPoints { get; set; }

        // Vendor Profile
        public string? BusinessName { get; set; }
        public string? TaxID { get; set; }
        public string? BusinessPhone { get; set; }
        public string? BusinessEmail { get; set; }
        public string? Website { get; set; }
        public string? BusinessDescription { get; set; }
        public string? ApprovalStatus { get; set; }

        // Admin Profile
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public string[]? Permissions { get; set; }
    }

    public class VendorListItem
    {
        public int UserID { get; set; }
        public string BusinessName { get; set; }
        public string OwnerName { get; set; }
        public string Email { get; set; }
        public string TaxID { get; set; }
        public string? BusinessPhone { get; set; }
        public DateTime RegisteredDate { get; set; }
        public string ApprovalStatus { get; set; }
    }
}