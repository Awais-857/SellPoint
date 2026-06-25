// Add these to your Models folder

namespace SellPoint.API.Models
{
    public class AddToCartModel
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartModel
    {
        public int Quantity { get; set; }
    }

    public class AddressModel
    {
        public string AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Country { get; set; } = "Pakistan";
        public bool IsDefault { get; set; }
    }

    public class CreateOrderModel
    {
        public int AddressId { get; set; }
        public string PaymentMethod { get; set; }
        public decimal SubTotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateProductModel
    {
        public int CategoryId { get; set; }
        public string ProductName { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public decimal DiscountPercent { get; set; }
        public string? Sku { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UpdateProductModel
    {
        public int? CategoryId { get; set; }
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? StockQuantity { get; set; }
        public decimal? DiscountPercent { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
    }

    public class UpdateStatusModel
    {
        public string Status { get; set; }
    }

    public class CreateCategoryModel
    {
        public string CategoryName { get; set; }
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UpdateCategoryModel
    {
        public string CategoryName { get; set; }
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
    }
}