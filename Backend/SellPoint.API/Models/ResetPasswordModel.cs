using System.ComponentModel.DataAnnotations;

namespace SellPoint.API.Models
{
    public class ResetPasswordModel
    {
        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; }

        [Required(ErrorMessage = "New password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; }

        [Required(ErrorMessage = "Confirm password is required")]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }
    }
}