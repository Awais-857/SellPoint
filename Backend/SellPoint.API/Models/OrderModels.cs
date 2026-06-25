using System;

namespace SellPoint.API.Models
{
    public class OrderDetail
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }  // Add this for admin view
        public DateTime OrderDate { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }
        public decimal SubTotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Country { get; set; }
    }

    public class AdminOrderDetail : OrderDetail
    {
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }
        public List<OrderItemWithVendor> Items { get; set; }
    }

    public class OrderItemWithVendor
    {
        public int OrderItemId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int VendorId { get; set; }
        public string VendorName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string ItemStatus { get; set; }
    }

    public class AdminOrderListItem
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public DateTime OrderDate { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentStatus { get; set; }
        public decimal TotalAmount { get; set; }
        public int ItemCount { get; set; }
        public bool HasDispute { get; set; }
    }

    public class CreateDisputeModel
    {
        public int OrderId { get; set; }
        public string Reason { get; set; }
        public string UserType { get; set; } // "Customer" or "Vendor"
    }

    public class DisputeListItem
    {
        public int DisputeId { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int? VendorId { get; set; }
        public string VendorName { get; set; }
        public string Reason { get; set; }
        public string Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public string AdminNotes { get; set; }
        public DateTime? ResolvedDate { get; set; }
    }

    public class ResolveDisputeModel
    {
        public string AdminNotes { get; set; }
        public string Action { get; set; } // "Resolve", "CancelOrder", "Refund"
    }
}