using System;

namespace SellPoint.API.Models
{
    public class User
    {
        public int UserID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Country { get; set; }
        public string UserType { get; set; }
        public bool IsActive { get; set; }
        public bool IsEmailVerified { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public int FailedLoginAttempts { get; set; }
        public bool IsLocked { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}