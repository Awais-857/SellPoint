using System;

namespace SellPoint.API.Models
{
    public class OrderTrackingInfo
    {
        public int OrderId { get; set; }
        public string OrderStatus { get; set; }
        public string? TrackingNumber { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? EstimatedDeliveryDate { get; set; }
        public string ShippingAddress { get; set; }
        public int TotalItems { get; set; }
        public decimal TotalAmount { get; set; }
    }
}