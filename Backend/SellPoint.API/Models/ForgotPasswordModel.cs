using System.ComponentModel.DataAnnotations;

namespace SellPoint.API.Models
{
    public class ForgotPasswordModel
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid Email Address")]
        public string Email { get; set; }
    }
}