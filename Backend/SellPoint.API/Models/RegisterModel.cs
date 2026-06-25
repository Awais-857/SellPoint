using System.ComponentModel.DataAnnotations;

namespace SellPoint.API.Models
{
    public class RegisterModel
    {
        // Basic User Fields (Common for all)
        [Required(ErrorMessage = "First Name is required")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Last Name is required")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid Email Address")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Username is required")]
        [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; }

        [Required(ErrorMessage = "User Type is required")]
        [RegularExpression("^(Customer|Vendor|Admin)$", ErrorMessage = "User Type must be Customer, Vendor, or Admin")]
        public string UserType { get; set; }

        // Optional fields for all users
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }

        // Vendor specific fields
        public string? BusinessName { get; set; }
        public string? TaxID { get; set; }
        public string? BusinessPhone { get; set; }
        public string? BusinessEmail { get; set; }
        public string? Website { get; set; }
        public string? BusinessDescription { get; set; }

        // Admin specific fields
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
    }
}