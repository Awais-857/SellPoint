using System.ComponentModel.DataAnnotations;

namespace SellPoint.API.Models
{
    public class LoginModel
    {
        [Required(ErrorMessage = "Username or Email is required")]
        public string UsernameOrEmail { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; }
    }
}