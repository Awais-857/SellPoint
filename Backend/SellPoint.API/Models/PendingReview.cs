namespace SellPoint.API.Models
{
    public class PendingReview
    {
        public int ReviewId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string CustomerName { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}