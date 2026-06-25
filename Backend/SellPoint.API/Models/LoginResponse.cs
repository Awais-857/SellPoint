namespace SellPoint.API.Models
{
    public class LoginResponse
    {
        public string Token { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string UserType { get; set; }
        public int UserId { get; set; }
    }
}