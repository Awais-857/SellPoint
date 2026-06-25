using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SellPoint.API.Models;
using System;
using System.Data;
using System.Threading.Tasks;
using System.Net.Http;

namespace SellPoint.API.Services
{
    public class DatabaseService
    {
        private readonly string _connectionString;
        private readonly IConfiguration _configuration;

        public DatabaseService(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // ========== AUTH & USER MANAGEMENT ==========

        public async Task<(bool UsernameExists, bool EmailExists)> CheckUserExists(string username, string email)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_CheckUserExists", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Username", username);
                cmd.Parameters.AddWithValue("@Email", email);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        bool usernameExists = reader.GetInt32(0) == 1;
                        bool emailExists = reader.GetInt32(1) == 1;
                        return (usernameExists, emailExists);
                    }
                }
            }
            return (false, false);
        }

        public async Task<int> RegisterUser(RegisterModel user, string hashedPassword)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_RegisterUser", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@FirstName", user.FirstName);
                cmd.Parameters.AddWithValue("@LastName", user.LastName);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@Username", user.Username);
                cmd.Parameters.AddWithValue("@PasswordHash", hashedPassword);
                cmd.Parameters.AddWithValue("@PhoneNumber", (object)user.PhoneNumber ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DateOfBirth", user.DateOfBirth ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@UserType", user.UserType);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<User> ValidateUser(string usernameOrEmail)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_ValidateUserLogin", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UsernameOrEmail", usernameOrEmail);
                cmd.Parameters.AddWithValue("@IPAddress", DBNull.Value);
                cmd.Parameters.AddWithValue("@UserAgent", DBNull.Value);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new User
                        {
                            UserID = reader.GetInt32(reader.GetOrdinal("UserID")),
                            FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                            LastName = reader.GetString(reader.GetOrdinal("LastName")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                            UserType = reader.GetString(reader.GetOrdinal("UserType")),
                            IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            FailedLoginAttempts = reader.GetInt32(reader.GetOrdinal("FailedLoginAttempts")),
                            IsLocked = reader.GetBoolean(reader.GetOrdinal("IsLocked"))
                        };
                    }
                }
            }
            return null;
        }

        public async Task UpdateLoginSuccess(int userId, string ipAddress = null, string userAgent = null)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateLoginSuccess", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@IPAddress", (object)ipAddress ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@UserAgent", (object)userAgent ?? DBNull.Value);
                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task UpdateLoginFailure(string usernameOrEmail, string ipAddress = null, string userAgent = null)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateLoginFailure", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UsernameOrEmail", usernameOrEmail);
                cmd.Parameters.AddWithValue("@IPAddress", (object)ipAddress ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@UserAgent", (object)userAgent ?? DBNull.Value);
                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task<int?> RequestPasswordReset(string email, string resetToken)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_RequestPasswordReset", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Email", email);
                cmd.Parameters.AddWithValue("@ResetToken", resetToken);
                cmd.Parameters.AddWithValue("@ExpiryHours", 24);
                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result != DBNull.Value ? Convert.ToInt32(result) : (int?)null;
            }
        }

        public async Task<int?> ValidateResetToken(string resetToken)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_ValidateResetToken", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ResetToken", resetToken);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                        return reader.GetInt32(reader.GetOrdinal("UserID"));
                }
            }
            return null;
        }

        public async Task<bool> ResetPassword(string resetToken, string newPasswordHash)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_ResetPassword", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ResetToken", resetToken);
                cmd.Parameters.AddWithValue("@NewPasswordHash", newPasswordHash);
                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result != null && Convert.ToInt32(result) > 0;
            }
        }

        public async Task<(int VendorProfileId, string UploadToken)> CreateVendorProfile(int userId, RegisterModel model)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_CreateVendorProfile", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserID", userId);
        cmd.Parameters.AddWithValue("@BusinessName", model.BusinessName ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@TaxID", model.TaxID ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@BusinessPhone", model.BusinessPhone ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@BusinessEmail", model.BusinessEmail ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Website", model.Website ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@BusinessDescription", model.BusinessDescription ?? (object)DBNull.Value);
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                int vendorProfileId = Convert.ToInt32(reader.GetValue(0));
                string uploadToken = reader.GetString(1);
                return (vendorProfileId, uploadToken);
            }
        }
    }
    return (0, null);
}

        public async Task<bool> ValidateVendorUploadToken(int userId, string token)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("SELECT COUNT(1) FROM VendorProfiles WHERE UserID = @UserID AND UploadToken = @Token AND UploadTokenExpiry > GETDATE() AND ApprovalStatus = 'Pending'", conn))
            {
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@Token", token);
                await conn.OpenAsync();
                int count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                return count > 0;
            }
        }

        public async Task<int> CreateCustomerProfile(int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_CreateCustomerProfile", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<int> CreateAdminProfile(int userId, RegisterModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_CreateAdminProfile", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@Department", model.Department ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@JobTitle", model.JobTitle ?? (object)DBNull.Value);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<UserProfile> GetUserProfile(int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetUserProfile", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new UserProfile
                        {
                            UserID = reader.GetInt32(reader.GetOrdinal("UserID")),
                            FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                            LastName = reader.GetString(reader.GetOrdinal("LastName")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                            DateOfBirth = reader.IsDBNull(reader.GetOrdinal("DateOfBirth")) ? null : reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                            UserType = reader.GetString(reader.GetOrdinal("UserType")),
                            IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            LoyaltyPoints = reader.IsDBNull(reader.GetOrdinal("LoyaltyPoints")) ? null : reader.GetInt32(reader.GetOrdinal("LoyaltyPoints")),
                            BusinessName = reader.IsDBNull(reader.GetOrdinal("BusinessName")) ? null : reader.GetString(reader.GetOrdinal("BusinessName")),
                            TaxID = reader.IsDBNull(reader.GetOrdinal("TaxID")) ? null : reader.GetString(reader.GetOrdinal("TaxID")),
                            BusinessPhone = reader.IsDBNull(reader.GetOrdinal("BusinessPhone")) ? null : reader.GetString(reader.GetOrdinal("BusinessPhone")),
                            BusinessEmail = reader.IsDBNull(reader.GetOrdinal("BusinessEmail")) ? null : reader.GetString(reader.GetOrdinal("BusinessEmail")),
                            Website = reader.IsDBNull(reader.GetOrdinal("Website")) ? null : reader.GetString(reader.GetOrdinal("Website")),
                            BusinessDescription = reader.IsDBNull(reader.GetOrdinal("BusinessDescription")) ? null : reader.GetString(reader.GetOrdinal("BusinessDescription")),
                            ApprovalStatus = reader.IsDBNull(reader.GetOrdinal("ApprovalStatus")) ? null : reader.GetString(reader.GetOrdinal("ApprovalStatus")),
                            Department = reader.IsDBNull(reader.GetOrdinal("Department")) ? null : reader.GetString(reader.GetOrdinal("Department")),
                            JobTitle = reader.IsDBNull(reader.GetOrdinal("JobTitle")) ? null : reader.GetString(reader.GetOrdinal("JobTitle")),
                            Permissions = reader.IsDBNull(reader.GetOrdinal("Permissions")) ? null :
                                System.Text.Json.JsonSerializer.Deserialize<string[]>(reader.GetString(reader.GetOrdinal("Permissions")))
                        };
                    }
                }
            }
            return null;
        }

        public async Task<VendorProfile?> GetVendorProfile(int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("SELECT ApprovalStatus FROM VendorProfiles WHERE UserID = @UserID", conn))
            {
                cmd.Parameters.AddWithValue("@UserID", userId);
                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                if (result != null)
                {
                    return new VendorProfile { ApprovalStatus = result.ToString() };
                }
            }
            return null;
        }

        // ========== CART ==========

        public async Task<List<CartItem>> GetCartItems(int customerId)
        {
            var items = new List<CartItem>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetCartItems", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new CartItem
                        {
                            CartId = reader.GetInt32(reader.GetOrdinal("CartID")),
                            ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                            DiscountPercent = reader.IsDBNull(reader.GetOrdinal("DiscountPercent")) ? 0 : reader.GetDecimal(reader.GetOrdinal("DiscountPercent")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                            VendorName = reader.GetString(reader.GetOrdinal("VendorName")),
                            ItemTotal = reader.GetDecimal(reader.GetOrdinal("ItemTotal")),
                            StockQuantity = reader.GetInt32(reader.GetOrdinal("StockQuantity"))
                        });
                    }
                }
            }
            return items;
        }

        public async Task<CartSummary> GetCartTotal(int customerId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetCartTotal", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new CartSummary
                        {
                            VendorCount = reader.GetInt32(reader.GetOrdinal("VendorCount")),
                            ItemCount = reader.GetInt32(reader.GetOrdinal("ItemCount")),
                            TotalQuantity = reader.GetInt32(reader.GetOrdinal("TotalQuantity")),
                            Subtotal = reader.GetDecimal(reader.GetOrdinal("SubTotal")),
                            EstimatedTax = reader.GetDecimal(reader.GetOrdinal("EstimatedTax")),
                            EstimatedShipping = reader.GetDecimal(reader.GetOrdinal("EstimatedShipping"))
                        };
                    }
                }
            }
            return new CartSummary();
        }

        public async Task<int> AddToCart(int customerId, int productId, int quantity)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_AddToCart", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@ProductID", productId);
                cmd.Parameters.AddWithValue("@Quantity", quantity);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task<int> UpdateCartQuantity(int cartId, int customerId, int quantity)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateCartQuantity", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CartID", cartId);
                cmd.Parameters.AddWithValue("@Quantity", quantity);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task<int> RemoveFromCart(int cartId, int customerId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_RemoveFromCart", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CartID", cartId);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task<int> ClearCart(int customerId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_ClearCart", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync();
            }
        }

        // ========== ADDRESSES ==========

        public async Task<List<Address>> GetUserAddresses(int userId)
        {
            var addresses = new List<Address>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetUserAddresses", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        addresses.Add(new Address
                        {
                            AddressId = reader.GetInt32(reader.GetOrdinal("AddressID")),
                            AddressLine1 = reader.GetString(reader.GetOrdinal("AddressLine1")),
                            AddressLine2 = reader.IsDBNull(reader.GetOrdinal("AddressLine2")) ? null : reader.GetString(reader.GetOrdinal("AddressLine2")),
                            City = reader.GetString(reader.GetOrdinal("City")),
                            State = reader.GetString(reader.GetOrdinal("State")),
                            ZipCode = reader.GetString(reader.GetOrdinal("ZipCode")),
                            Country = reader.GetString(reader.GetOrdinal("Country")),
                            IsDefault = reader.GetBoolean(reader.GetOrdinal("IsDefault"))
                        });
                    }
                }
            }
            return addresses;
        }

        public async Task<int> AddAddress(int userId, AddressModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_AddAddress", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@AddressLine1", model.AddressLine1);
                cmd.Parameters.AddWithValue("@AddressLine2", (object)model.AddressLine2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@City", model.City);
                cmd.Parameters.AddWithValue("@State", model.State);
                cmd.Parameters.AddWithValue("@ZipCode", model.ZipCode);
                cmd.Parameters.AddWithValue("@Country", model.Country);
                cmd.Parameters.AddWithValue("@IsDefault", model.IsDefault);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<bool> UpdateAddress(int addressId, int userId, AddressModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateAddress", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@AddressID", addressId);
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@AddressLine1", model.AddressLine1);
                cmd.Parameters.AddWithValue("@AddressLine2", (object)model.AddressLine2 ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@City", model.City);
                cmd.Parameters.AddWithValue("@State", model.State);
                cmd.Parameters.AddWithValue("@ZipCode", model.ZipCode);
                cmd.Parameters.AddWithValue("@Country", model.Country);
                cmd.Parameters.AddWithValue("@IsDefault", model.IsDefault);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
            }
        }

        public async Task<bool> DeleteAddress(int addressId, int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_DeleteAddress", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@AddressID", addressId);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
            }
        }

        // ========== ORDERS ==========

        public async Task<int> CreateOrder(int customerId, CreateOrderModel model)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        await conn.OpenAsync();
        using (SqlTransaction transaction = conn.BeginTransaction())
        {
            try
            {
                // 1. Create the order
                int orderId;
                using (SqlCommand cmd = new SqlCommand("sp_CreateOrder", conn, transaction))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@AddressID", model.AddressId);
                    cmd.Parameters.AddWithValue("@PaymentMethod", model.PaymentMethod);
                    cmd.Parameters.AddWithValue("@SubTotal", model.SubTotal);
                    cmd.Parameters.AddWithValue("@ShippingCost", model.ShippingCost);
                    cmd.Parameters.AddWithValue("@TaxAmount", model.TaxAmount);
                    cmd.Parameters.AddWithValue("@DiscountAmount", model.DiscountAmount);
                    cmd.Parameters.AddWithValue("@TotalAmount", model.TotalAmount);
                    cmd.Parameters.AddWithValue("@Notes", (object)model.Notes ?? DBNull.Value);
                    orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                // 2. Get cart items
                var cartItems = await GetCartItems(customerId);
                foreach (var item in cartItems)
                {
                    // Get vendor ID for this product
                    int vendorId = await GetProductVendorId(item.ProductId, conn, transaction);
                    if (vendorId == 0) continue;

                    decimal discountAmount = (item.Price * item.DiscountPercent / 100) * item.Quantity;
                    decimal totalPrice = (item.Price * item.Quantity) - discountAmount;

                    using (SqlCommand cmd = new SqlCommand("sp_AddOrderItem", conn, transaction))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.Parameters.AddWithValue("@ProductID", item.ProductId);
                        cmd.Parameters.AddWithValue("@VendorID", vendorId);
                        cmd.Parameters.AddWithValue("@Quantity", item.Quantity);
                        cmd.Parameters.AddWithValue("@UnitPrice", item.Price);
                        cmd.Parameters.AddWithValue("@DiscountAmount", discountAmount);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }

                // 3. Clear cart
                await ClearCart(customerId);

                transaction.Commit();
                return orderId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}

// Helper method to get vendor ID for a product
private async Task<int> GetProductVendorId(int productId, SqlConnection conn, SqlTransaction transaction)
{
    using (SqlCommand cmd = new SqlCommand("SELECT VendorID FROM Products WHERE ProductID = @ProductID", conn, transaction))
    {
        cmd.Parameters.AddWithValue("@ProductID", productId);
        var result = await cmd.ExecuteScalarAsync();
        return result != null ? Convert.ToInt32(result) : 0;
    }
}

        public async Task<List<CustomerOrder>> GetCustomerOrders(int customerId, string? status = null)
        {
            var orders = new List<CustomerOrder>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetCustomerOrders", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new CustomerOrder
                        {
                            OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                            PaymentStatus = reader.GetString(reader.GetOrdinal("PaymentStatus")),
                            TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                            ItemCount = reader.GetInt32(reader.GetOrdinal("ItemCount"))
                        });
                    }
                }
            }
            return orders;
        }

        public async Task<Models.OrderDetail?> GetOrderById(int orderId, int userId, string userType)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_GetOrderById", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@OrderID", orderId);
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                return new Models.OrderDetail
                {
                    OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                    CustomerId = 0, // Not returned by sp_GetOrderById; will be set separately if needed
                    OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                    OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                    PaymentStatus = reader.GetString(reader.GetOrdinal("PaymentStatus")),
                    PaymentMethod = reader.GetString(reader.GetOrdinal("PaymentMethod")),
                    SubTotal = reader.GetDecimal(reader.GetOrdinal("SubTotal")),
                    ShippingCost = reader.GetDecimal(reader.GetOrdinal("ShippingCost")),
                    TaxAmount = reader.GetDecimal(reader.GetOrdinal("TaxAmount")),
                    DiscountAmount = reader.GetDecimal(reader.GetOrdinal("DiscountAmount")),
                    TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                    AddressLine1 = reader.GetString(reader.GetOrdinal("AddressLine1")),
                    AddressLine2 = reader.IsDBNull(reader.GetOrdinal("AddressLine2")) ? null : reader.GetString(reader.GetOrdinal("AddressLine2")),
                    City = reader.GetString(reader.GetOrdinal("City")),
                    State = reader.GetString(reader.GetOrdinal("State")),
                    ZipCode = reader.GetString(reader.GetOrdinal("ZipCode")),
                    Country = reader.GetString(reader.GetOrdinal("Country"))
                };
            }
        }
    }
    return null;
}

        public async Task<List<OrderItem>> GetOrderItems(int orderId)
        {
            var items = new List<OrderItem>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetOrderItems", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new OrderItem
                        {
                            OrderItemId = reader.GetInt32(reader.GetOrdinal("OrderItemID")),
                            ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                            UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                            TotalPrice = reader.GetDecimal(reader.GetOrdinal("TotalPrice")),
                            ItemStatus = reader.GetString(reader.GetOrdinal("ItemStatus")),
                            VendorName = reader.GetString(reader.GetOrdinal("VendorName"))
                        });
                    }
                }
            }
            return items;
        }

        public async Task<bool> CancelOrder(int orderId, int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateOrderStatus", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@NewStatus", "Cancelled");
                cmd.Parameters.AddWithValue("@ChangedBy", userId);
                cmd.Parameters.AddWithValue("@Notes", "Order cancelled by user");
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        public async Task<bool> Reorder(int orderId, int userId)
        {
            var items = await GetOrderItems(orderId);
            foreach (var item in items)
            {
                await AddToCart(userId, item.ProductId, item.Quantity);
            }
            return true;
        }

        // ========== VENDOR METHODS ==========

        public async Task<List<VendorProduct>> GetVendorProducts(int vendorId)
        {
            var products = new List<VendorProduct>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetVendorProducts", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@VendorID", vendorId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        products.Add(new VendorProduct
                        {
                            ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                            CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                            Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                            StockQuantity = reader.GetInt32(reader.GetOrdinal("StockQuantity")),
                            DiscountPercent = reader.GetDecimal(reader.GetOrdinal("DiscountPercent")),
                            Sku = reader.IsDBNull(reader.GetOrdinal("SKU")) ? null : reader.GetString(reader.GetOrdinal("SKU")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                        });
                    }
                }
            }
            return products;
        }

        public async Task<int> CreateProduct(int vendorId, CreateProductModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_CreateProduct", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@VendorID", vendorId);
                cmd.Parameters.AddWithValue("@CategoryID", model.CategoryId);
                cmd.Parameters.AddWithValue("@ProductName", model.ProductName);
                cmd.Parameters.AddWithValue("@Description", (object)model.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Price", model.Price);
                cmd.Parameters.AddWithValue("@StockQuantity", model.StockQuantity);
                cmd.Parameters.AddWithValue("@DiscountPercent", model.DiscountPercent);
                cmd.Parameters.AddWithValue("@SKU", (object)model.Sku ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ImageUrl", (object)model.ImageUrl ?? DBNull.Value);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<bool> UpdateProduct(int productId, int vendorId, UpdateProductModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateProduct", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProductID", productId);
                cmd.Parameters.AddWithValue("@CategoryID", (object)model.CategoryId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ProductName", (object)model.ProductName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Description", (object)model.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Price", (object)model.Price ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@StockQuantity", (object)model.StockQuantity ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DiscountPercent", (object)model.DiscountPercent ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ImageUrl", (object)model.ImageUrl ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsActive", (object)model.IsActive ?? DBNull.Value);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        public async Task<bool> DeleteProduct(int productId, int vendorId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_DeleteProduct", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProductID", productId);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        public async Task<bool> ToggleProductStatus(int productId, int vendorId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("SELECT IsActive FROM Products WHERE ProductID = @ProductID AND VendorID = @VendorID", conn))
                {
                    cmd.Parameters.AddWithValue("@ProductID", productId);
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    await conn.OpenAsync();
                    var currentStatus = (bool?)await cmd.ExecuteScalarAsync();
                    if (!currentStatus.HasValue) return false;

                    using (SqlCommand updateCmd = new SqlCommand("UPDATE Products SET IsActive = @IsActive, ModifiedDate = GETDATE() WHERE ProductID = @ProductID", conn))
                    {
                        updateCmd.Parameters.AddWithValue("@IsActive", !currentStatus.Value);
                        updateCmd.Parameters.AddWithValue("@ProductID", productId);
                        return await updateCmd.ExecuteNonQueryAsync() > 0;
                    }
                }
            }
        }

        public async Task<List<VendorOrder>> GetVendorOrders(int vendorId, string? status = null)
        {
            var orders = new List<VendorOrder>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetVendorOrders", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@VendorID", vendorId);
                cmd.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new VendorOrder
                        {
                            OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                            OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                            TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                            Items = new List<VendorOrderItem>()
                        });
                    }
                }
            }
            return orders;
        }

        public async Task<bool> UpdateOrderItemStatus(int orderItemId, int vendorId, string status)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        // First verify this order item belongs to the vendor (security check)
        using (SqlCommand verifyCmd = new SqlCommand(@"
            SELECT COUNT(1) FROM OrderItems oi 
            INNER JOIN Products p ON oi.ProductID = p.ProductID 
            WHERE oi.OrderItemID = @OrderItemID AND p.VendorID = @VendorID", conn))
        {
            verifyCmd.Parameters.AddWithValue("@OrderItemID", orderItemId);
            verifyCmd.Parameters.AddWithValue("@VendorID", vendorId);
            await conn.OpenAsync();
            int count = (int)await verifyCmd.ExecuteScalarAsync();
            if (count == 0) return false;
        }

        // Execute the stored procedure to update status
        using (SqlCommand cmd = new SqlCommand("sp_UpdateOrderItemStatus", conn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@OrderItemID", orderItemId);
            cmd.Parameters.AddWithValue("@NewStatus", status);
            
            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) > 0;
        }
    }
}

        // ========== VENDOR REVENUE ==========

        public async Task<VendorRevenueSummary> GetVendorRevenueSummary(int vendorId)
        {
            var result = new VendorRevenueSummary();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // Total sales all time
                using (SqlCommand cmd = new SqlCommand("SELECT ISNULL(SUM(oi.TotalPrice), 0) FROM OrderItems oi WHERE oi.VendorID = @VendorID", conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    result.TotalSales = Convert.ToDecimal(await cmd.ExecuteScalarAsync());
                }

                // Monthly sales
                using (SqlCommand cmd = new SqlCommand(
                    @"SELECT ISNULL(SUM(oi.TotalPrice), 0) FROM OrderItems oi 
                      INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID AND YEAR(o.OrderDate) = YEAR(GETDATE()) AND MONTH(o.OrderDate) = MONTH(GETDATE())", conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    result.MonthlySales = Convert.ToDecimal(await cmd.ExecuteScalarAsync());
                }

                // Total orders count
                using (SqlCommand cmd = new SqlCommand(
                    @"SELECT COUNT(DISTINCT o.OrderID) FROM OrderItems oi 
                      INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID", conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    result.TotalOrders = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                result.AverageOrderValue = result.TotalOrders > 0 ? result.TotalSales / result.TotalOrders : 0;

                // Pending payments
                using (SqlCommand cmd = new SqlCommand(
                    @"SELECT ISNULL(SUM(oi.TotalPrice), 0) FROM OrderItems oi 
                      INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID AND o.PaymentStatus = 'Pending'", conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    result.PendingPayments = Convert.ToDecimal(await cmd.ExecuteScalarAsync());
                }

                // Order status counts
                using (SqlCommand cmd = new SqlCommand(
                    @"SELECT o.OrderStatus, COUNT(DISTINCT o.OrderID)
                      FROM OrderItems oi INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID GROUP BY o.OrderStatus", conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string status = reader.GetString(0);
                            int count = reader.GetInt32(1);
                            if (status == "Pending") result.PendingOrders = count;
                            else if (status == "Shipped") result.ShippedOrders = count;
                            else if (status == "Delivered") result.DeliveredOrders = count;
                        }
                    }
                }
            }
            return result;
        }

        public async Task<List<VendorTransaction>> GetVendorTransactions(int vendorId, int limit)
        {
            var transactions = new List<VendorTransaction>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand(
                @"SELECT TOP (@Limit) o.OrderID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount, u.FirstName, u.LastName 
                  FROM Orders o INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID 
                  INNER JOIN Users u ON o.CustomerID = u.UserID 
                  WHERE oi.VendorID = @VendorID ORDER BY o.OrderDate DESC", conn))
            {
                cmd.Parameters.AddWithValue("@VendorID", vendorId);
                cmd.Parameters.AddWithValue("@Limit", limit);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        transactions.Add(new VendorTransaction
                        {
                            OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            CustomerName = $"{reader.GetString(reader.GetOrdinal("FirstName"))} {reader.GetString(reader.GetOrdinal("LastName"))}",
                            OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                            PaymentStatus = reader.GetString(reader.GetOrdinal("PaymentStatus")),
                            TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount"))
                        });
                    }
                }
            }
            return transactions;
        }

        public async Task<List<ChartData>> GetVendorRevenueChart(int vendorId, string period)
        {
            var chartData = new List<ChartData>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = period == "monthly" ?
                    @"SELECT FORMAT(o.OrderDate, 'MMM yyyy') AS Label, ISNULL(SUM(oi.TotalPrice), 0) AS TotalRevenue
                      FROM OrderItems oi INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID AND o.OrderDate >= DATEADD(MONTH, -6, GETDATE())
                      GROUP BY FORMAT(o.OrderDate, 'MMM yyyy') ORDER BY MIN(o.OrderDate)" :
                    @"SELECT YEAR(o.OrderDate) AS Label, ISNULL(SUM(oi.TotalPrice), 0) AS TotalRevenue
                      FROM OrderItems oi INNER JOIN Orders o ON oi.OrderID = o.OrderID
                      WHERE oi.VendorID = @VendorID AND o.OrderDate >= DATEADD(YEAR, -5, GETDATE())
                      GROUP BY YEAR(o.OrderDate) ORDER BY YEAR(o.OrderDate)";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@VendorID", vendorId);
                    await conn.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            chartData.Add(new ChartData
                            {
                                Label = reader.GetString(0),
                                TotalRevenue = reader.GetDecimal(1)
                            });
                        }
                    }
                }
            }
            return chartData;
        }

        // ========== PRODUCTS ==========

        public async Task<ProductListResult> GetProducts(int? categoryId, int? vendorId, decimal? minPrice, decimal? maxPrice,
            string? searchTerm, string sortBy, string sortOrder, int pageNumber, int pageSize)
        {
            var products = new List<Product>();
            int totalCount = 0;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetProducts", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CategoryID", (object)categoryId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@VendorID", (object)vendorId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@MinPrice", (object)minPrice ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@MaxPrice", (object)maxPrice ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SearchTerm", (object)searchTerm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SortBy", sortBy);
                cmd.Parameters.AddWithValue("@SortOrder", sortOrder);
                cmd.Parameters.AddWithValue("@PageNumber", pageNumber);
                cmd.Parameters.AddWithValue("@PageSize", pageSize);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        totalCount = reader.GetInt32(reader.GetOrdinal("TotalCount"));
                        products.Add(new Product
                        {
                            ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                            VendorId = reader.GetInt32(reader.GetOrdinal("VendorID")),
                            CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                            Price = Convert.ToDecimal(reader["Price"]),
                            StockQuantity = reader.GetInt32(reader.GetOrdinal("StockQuantity")),
                            DiscountPercent = Convert.ToDecimal(reader["DiscountPercent"]),
                            Sku = reader.IsDBNull(reader.GetOrdinal("SKU")) ? null : reader.GetString(reader.GetOrdinal("SKU")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                            BusinessName = reader.GetString(reader.GetOrdinal("BusinessName")),
                            AverageRating = Convert.ToDecimal(reader["AverageRating"]),
                            ReviewCount = Convert.ToInt32(reader["ReviewCount"])
                        });
                    }
                }
            }

            return new ProductListResult
            {
                Products = products,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        public async Task<Product?> GetProductById(int productId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetProductById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProductID", productId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new Product
                        {
                            ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                            VendorId = reader.GetInt32(reader.GetOrdinal("VendorID")),
                            CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                            Price = reader.GetDecimal(reader.GetOrdinal("Price")),
                            StockQuantity = reader.GetInt32(reader.GetOrdinal("StockQuantity")),
                            DiscountPercent = reader.GetDecimal(reader.GetOrdinal("DiscountPercent")),
                            Sku = reader.IsDBNull(reader.GetOrdinal("SKU")) ? null : reader.GetString(reader.GetOrdinal("SKU")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            BusinessName = reader.GetString(reader.GetOrdinal("BusinessName")),
                            AverageRating = Convert.ToDecimal(reader["AverageRating"]),
                            ReviewCount = Convert.ToInt32(reader["ReviewCount"])
                        };
                    }
                }
            }
            return null;
        }
        
        public async Task<List<Review>> GetProductReviews(int productId, bool onlyApproved)
        {
            var reviews = new List<Review>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetProductReviews", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ProductID", productId);
                cmd.Parameters.AddWithValue("@OnlyApproved", onlyApproved);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        reviews.Add(new Review
                        {
                            ReviewId = reader.GetInt32(reader.GetOrdinal("ReviewID")),
                            Rating = reader.GetInt32(reader.GetOrdinal("Rating")),
                            Comment = reader.IsDBNull(reader.GetOrdinal("Comment")) ? null : reader.GetString(reader.GetOrdinal("Comment")),
                            CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                        });
                    }
                }
            }
            return reviews;
        }

        // ========== CATEGORIES ==========

        public async Task<List<Category>> GetCategories(int? parentId = null, bool includeInactive = false)
        {
            var categories = new List<Category>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetCategories", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ParentCategoryID", (object)parentId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IncludeInactive", includeInactive);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        categories.Add(new Category
                        {
                            CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                            ParentCategoryId = reader.IsDBNull(reader.GetOrdinal("ParentCategoryID")) ? null : reader.GetInt32(reader.GetOrdinal("ParentCategoryID")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            ProductCount = reader.IsDBNull(reader.GetOrdinal("ProductCount")) ? 0 : reader.GetInt32(reader.GetOrdinal("ProductCount"))
                        });
                    }
                }
            }
            return categories;
        }

        public async Task<Category?> GetCategoryById(int categoryId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetCategoryById", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CategoryID", categoryId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new Category
                        {
                            CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                            ParentCategoryId = reader.IsDBNull(reader.GetOrdinal("ParentCategoryID")) ? null : reader.GetInt32(reader.GetOrdinal("ParentCategoryID")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                        };
                    }
                }
            }
            return null;
        }

        // ========== ADMIN METHODS ==========

        public async Task<List<AdminVendor>> GetAllVendors(string? status = null)
        {
            var vendors = new List<AdminVendor>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetAllVendors", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        vendors.Add(new AdminVendor
                        {
                            UserId = reader.GetInt32(reader.GetOrdinal("UserID")),
                            BusinessName = reader.GetString(reader.GetOrdinal("BusinessName")),
                            OwnerName = reader.GetString(reader.GetOrdinal("OwnerName")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            TaxId = reader.GetString(reader.GetOrdinal("TaxID")),
                            BusinessPhone = reader.IsDBNull(reader.GetOrdinal("BusinessPhone")) ? null : reader.GetString(reader.GetOrdinal("BusinessPhone")),
                            ApprovalStatus = reader.GetString(reader.GetOrdinal("ApprovalStatus")),
                            RegisteredDate = reader.GetDateTime(reader.GetOrdinal("RegisteredDate")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                        });
                    }
                }
            }
            return vendors;
        }

        public async Task<List<VendorListItem>> GetPendingVendors()
        {
            var vendors = new List<VendorListItem>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetPendingVendors", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        vendors.Add(new VendorListItem
                        {
                            UserID = reader.GetInt32(reader.GetOrdinal("UserID")),
                            BusinessName = reader.GetString(reader.GetOrdinal("BusinessName")),
                            OwnerName = reader.GetString(reader.GetOrdinal("OwnerName")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            TaxID = reader.GetString(reader.GetOrdinal("TaxID")),
                            BusinessPhone = reader.IsDBNull(reader.GetOrdinal("BusinessPhone")) ? null : reader.GetString(reader.GetOrdinal("BusinessPhone")),
                            RegisteredDate = reader.GetDateTime(reader.GetOrdinal("RegisteredDate")),
                            ApprovalStatus = reader.GetString(reader.GetOrdinal("ApprovalStatus"))
                        });
                    }
                }
            }
            return vendors;
        }

        public async Task<bool> UpdateVendorApproval(int userId, int adminUserId, string status, string? rejectionReason = null)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateVendorApproval", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@ApprovedBy", adminUserId);
                cmd.Parameters.AddWithValue("@Status", status);
                cmd.Parameters.AddWithValue("@RejectionReason", (object)rejectionReason ?? DBNull.Value);
                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result != null && Convert.ToInt32(result) > 0;
            }
        }

        public async Task<bool> ToggleUserStatus(int userId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand getCmd = new SqlCommand("SELECT IsActive FROM Users WHERE UserID = @UserID", conn))
                {
                    getCmd.Parameters.AddWithValue("@UserID", userId);
                    await conn.OpenAsync();
                    var currentStatus = (bool?)await getCmd.ExecuteScalarAsync();
                    if (!currentStatus.HasValue) return false;

                    using (SqlCommand updateCmd = new SqlCommand("UPDATE Users SET IsActive = @IsActive, ModifiedDate = GETDATE() WHERE UserID = @UserID", conn))
                    {
                        updateCmd.Parameters.AddWithValue("@IsActive", !currentStatus.Value);
                        updateCmd.Parameters.AddWithValue("@UserID", userId);
                        return await updateCmd.ExecuteNonQueryAsync() > 0;
                    }
                }
            }
        }

        public async Task<int> CreateCategory(CreateCategoryModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_CreateCategory", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CategoryName", model.CategoryName);
                cmd.Parameters.AddWithValue("@Description", (object)model.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ParentCategoryID", (object)model.ParentCategoryId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ImageUrl", (object)model.ImageUrl ?? DBNull.Value);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<bool> UpdateCategory(int categoryId, UpdateCategoryModel model)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateCategory", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CategoryID", categoryId);
                cmd.Parameters.AddWithValue("@CategoryName", model.CategoryName);
                cmd.Parameters.AddWithValue("@Description", (object)model.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ParentCategoryID", (object)model.ParentCategoryId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ImageUrl", (object)model.ImageUrl ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IsActive", model.IsActive);
                await conn.OpenAsync();
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        public async Task<bool> DeleteCategory(int categoryId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_DeleteCategory", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CategoryID", categoryId);
                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result != null && Convert.ToInt32(result) > 0;
            }
        }

        public async Task<bool> ToggleCategoryStatus(int categoryId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("SELECT IsActive FROM Categories WHERE CategoryID = @CategoryID", conn))
                {
                    cmd.Parameters.AddWithValue("@CategoryID", categoryId);
                    await conn.OpenAsync();
                    var currentStatus = (bool?)await cmd.ExecuteScalarAsync();
                    if (!currentStatus.HasValue) return false;

                    using (SqlCommand updateCmd = new SqlCommand("UPDATE Categories SET IsActive = @IsActive, ModifiedDate = GETDATE() WHERE CategoryID = @CategoryID", conn))
                    {
                        updateCmd.Parameters.AddWithValue("@IsActive", !currentStatus.Value);
                        updateCmd.Parameters.AddWithValue("@CategoryID", categoryId);
                        return await updateCmd.ExecuteNonQueryAsync() > 0;
                    }
                }
            }
        }

        // ========== REPORTS (ADMIN) ==========

        public async Task<List<SalesReportRow>> GetSalesReport(string type, string? fromDate = null, string? toDate = null)
        {
            var report = new List<SalesReportRow>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetSalesReportData", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ReportType", type);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        report.Add(new SalesReportRow
                        {
                            Period = reader.GetString(reader.GetOrdinal("Period")),
                            TotalOrders = reader.GetInt32(reader.GetOrdinal("TotalOrders")),
                            TotalRevenue = reader.GetDecimal(reader.GetOrdinal("TotalRevenue")),
                            TotalSubTotal = reader.GetDecimal(reader.GetOrdinal("TotalSubTotal")),
                            TotalShipping = reader.GetDecimal(reader.GetOrdinal("TotalShipping")),
                            TotalTax = reader.GetDecimal(reader.GetOrdinal("TotalTax")),
                            AverageOrderValue = reader.GetDecimal(reader.GetOrdinal("AverageOrderValue")),
                            UniqueCustomers = reader.GetInt32(reader.GetOrdinal("UniqueCustomers"))
                        });
                    }
                }
            }
            return report;
        }

        public async Task<List<TopVendor>> GetTopVendors(string? fromDate, string? toDate, int topN)
        {
            var vendors = new List<TopVendor>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetTopVendors", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@FromDate", (object)fromDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ToDate", (object)toDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TopN", topN);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        vendors.Add(new TopVendor
                        {
                            BusinessName = reader.GetString(reader.GetOrdinal("BusinessName")),
                            TotalOrders = reader.GetInt32(reader.GetOrdinal("TotalOrders")),
                            TotalRevenue = reader.GetDecimal(reader.GetOrdinal("TotalRevenue"))
                        });
                    }
                }
            }
            return vendors;
        }

        public async Task<List<TopProduct>> GetTopProducts(string? fromDate, string? toDate, int topN)
        {
            var products = new List<TopProduct>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetBestSellingProducts", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@FromDate", (object)fromDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ToDate", (object)toDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TopN", topN);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        products.Add(new TopProduct
                        {
                            ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                            TotalQuantitySold = reader.GetInt32(reader.GetOrdinal("TotalQuantitySold")),
                            TotalRevenue = reader.GetDecimal(reader.GetOrdinal("TotalRevenue"))
                        });
                    }
                }
            }
            return products;
        }

        public async Task<DashboardStats> GetDashboardStats()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetDashboardStats", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new DashboardStats
                        {
                            TotalCustomers = reader.GetInt32(reader.GetOrdinal("TotalCustomers")),
                            TotalVendors = reader.GetInt32(reader.GetOrdinal("TotalVendors")),
                            TotalProducts = reader.GetInt32(reader.GetOrdinal("TotalProducts")),
                            TodayOrders = reader.GetInt32(reader.GetOrdinal("TodayOrders")),
                            TodayRevenue = reader.GetDecimal(reader.GetOrdinal("TodayRevenue")),
                            PendingOrders = reader.GetInt32(reader.GetOrdinal("PendingOrders")),
                            PendingVendors = reader.GetInt32(reader.GetOrdinal("PendingVendors")),
                            PendingReviews = reader.GetInt32(reader.GetOrdinal("PendingReviews"))
                        };
                    }
                }
            }
            return new DashboardStats();
        }

        // ========== VENDOR DOCUMENTS ==========

        public async Task<int> UploadVendorDocument(int userId, string documentType, string fileName, string filePath, int? fileSize = null, string contentType = null)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UploadVendorDocument", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                cmd.Parameters.AddWithValue("@DocumentType", documentType);
                cmd.Parameters.AddWithValue("@FileName", fileName);
                cmd.Parameters.AddWithValue("@FilePath", filePath);
                cmd.Parameters.AddWithValue("@FileSize", fileSize ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ContentType", contentType ?? (object)DBNull.Value);
                await conn.OpenAsync();
                return Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }

        public async Task<List<VendorDocument>> GetVendorDocuments(int userId)
        {
            var documents = new List<VendorDocument>();
            using (SqlConnection conn = new SqlConnection(_connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetVendorDocuments", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserID", userId);
                await conn.OpenAsync();
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        documents.Add(new VendorDocument
                        {
                            DocumentID = reader.GetInt32(reader.GetOrdinal("DocumentID")),
                            DocumentType = reader.GetString(reader.GetOrdinal("DocumentType")),
                            FileName = reader.GetString(reader.GetOrdinal("FileName")),
                            FilePath = reader.GetString(reader.GetOrdinal("FilePath")),
                            FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                            ContentType = reader.IsDBNull(reader.GetOrdinal("ContentType")) ? null : reader.GetString(reader.GetOrdinal("ContentType")),
                            UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate")),
                            IsVerified = reader.GetBoolean(reader.GetOrdinal("IsVerified"))
                        });
                    }
                }
            }
            return documents;
        }

        // ========== ADMIN ORDERS ==========
public async Task<List<AdminOrderListItem>> GetAllOrders(string? status = null, DateTime? fromDate = null, DateTime? toDate = null, int page = 1, int pageSize = 50)
{
    var orders = new List<AdminOrderListItem>();
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_GetAllOrders", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FromDate", fromDate ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@ToDate", toDate ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PageNumber", page);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                orders.Add(new AdminOrderListItem
                {
                    OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                    CustomerId = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                    CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                    OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                    OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                    PaymentStatus = reader.GetString(reader.GetOrdinal("PaymentStatus")),
                    TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                    ItemCount = reader.GetInt32(reader.GetOrdinal("ItemCount")),
                    HasDispute = reader.GetBoolean(reader.GetOrdinal("HasDispute"))
                });
            }
        }
    }
    return orders;
}

public async Task<(bool Success, string Message, int ReviewId)> AddReview(int userId, int productId, int orderItemId, int rating, string? comment)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_AddReview", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@ProductID", productId);
        cmd.Parameters.AddWithValue("@CustomerID", userId);
        cmd.Parameters.AddWithValue("@OrderItemID", orderItemId);
        cmd.Parameters.AddWithValue("@Rating", rating);
        cmd.Parameters.AddWithValue("@Comment", (object?)comment ?? DBNull.Value);
        
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                int success = Convert.ToInt32(reader[0]);
                string message = reader[1].ToString();
                int reviewId = 0;
                // Only try to read third column if it exists (for new review)
                if (reader.FieldCount > 2 && !reader.IsDBNull(2))
                {
                    reviewId = Convert.ToInt32(reader[2]);
                }
                return (success == 1, message, reviewId);
            }
        }
    }
    return (false, "Failed to add review", 0);
}

// ========== REVIEW APPROVAL (ADMIN) ==========
public async Task<List<PendingReview>> GetPendingReviews()
{
    var reviews = new List<PendingReview>();
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_GetPendingReviews", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                reviews.Add(new PendingReview
                {
                    ReviewId = reader.GetInt32(reader.GetOrdinal("ReviewID")),
                    ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                    ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                    Rating = reader.GetInt32(reader.GetOrdinal("Rating")),
                    Comment = reader.IsDBNull(reader.GetOrdinal("Comment")) ? null : reader.GetString(reader.GetOrdinal("Comment")),
                    CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate"))
                });
            }
        }
    }
    return reviews;
}

public async Task<bool> ApproveReview(int reviewId)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_ApproveReview", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@ReviewID", reviewId);
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                int success = reader.GetInt32(0);
                return success == 1;
            }
        }
    }
    return false;
}

// ========== ORDER TRACKING ==========
public async Task<OrderTrackingInfo?> GetOrderTrackingInfo(int orderId, int userId, string userType)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        await conn.OpenAsync();
        
        // First verify user has permission to view this order
        string permissionQuery = userType == "Admin" 
            ? "SELECT COUNT(1) FROM Orders WHERE OrderID = @OrderID"
            : "SELECT COUNT(1) FROM Orders WHERE OrderID = @OrderID AND CustomerID = @UserID";
        
        using (SqlCommand checkCmd = new SqlCommand(permissionQuery, conn))
        {
            checkCmd.Parameters.AddWithValue("@OrderID", orderId);
            if (userType != "Admin")
                checkCmd.Parameters.AddWithValue("@UserID", userId);
            int count = (int)await checkCmd.ExecuteScalarAsync();
            if (count == 0) return null;
        }

        // Get tracking details
        using (SqlCommand cmd = new SqlCommand(@"
            SELECT o.OrderID, o.OrderStatus, o.TrackingNumber, o.OrderDate, o.EstimatedDeliveryDate,
                   o.TotalAmount,
                   (SELECT COUNT(1) FROM OrderItems WHERE OrderID = o.OrderID) AS TotalItems,
                   CONCAT(a.AddressLine1, ', ', a.City, ', ', a.State, ' ', a.ZipCode, ', ', a.Country) AS ShippingAddress
            FROM Orders o
            INNER JOIN Addresses a ON o.AddressID = a.AddressID
            WHERE o.OrderID = @OrderID", conn))
        {
            cmd.Parameters.AddWithValue("@OrderID", orderId);
            using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    return new OrderTrackingInfo
                    {
                        OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                        OrderStatus = reader.GetString(reader.GetOrdinal("OrderStatus")),
                        TrackingNumber = reader.IsDBNull(reader.GetOrdinal("TrackingNumber")) ? null : reader.GetString(reader.GetOrdinal("TrackingNumber")),
                        OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                        EstimatedDeliveryDate = reader.IsDBNull(reader.GetOrdinal("EstimatedDeliveryDate")) ? null : reader.GetDateTime(reader.GetOrdinal("EstimatedDeliveryDate")),
                        TotalItems = reader.GetInt32(reader.GetOrdinal("TotalItems")),
                        TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                        ShippingAddress = reader.GetString(reader.GetOrdinal("ShippingAddress"))
                    };
                }
            }
        }
    }
    return null;
}

public async Task<AdminOrderDetail?> GetAdminOrderDetail(int orderId)
{
    var orderDetail = await GetOrderById(orderId, 0, "Admin");
    if (orderDetail == null) return null;

    // 1. Get CustomerId from the order
    int customerId = 0;
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        using (SqlCommand cmd = new SqlCommand("SELECT CustomerID FROM Orders WHERE OrderID = @OrderID", conn))
        {
            cmd.Parameters.AddWithValue("@OrderID", orderId);
            await conn.OpenAsync();
            var result = await cmd.ExecuteScalarAsync();
            if (result != null) customerId = Convert.ToInt32(result);
        }
    }

    // 2. Get order items with vendor details
    var items = new List<OrderItemWithVendor>();
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        await conn.OpenAsync();
        string query = @"
            SELECT oi.OrderItemID, oi.ProductID, p.ProductName, oi.VendorID,
                   vp.BusinessName AS VendorName, oi.Quantity, oi.UnitPrice,
                   oi.TotalPrice, oi.ItemStatus
            FROM OrderItems oi
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            INNER JOIN VendorProfiles vp ON oi.VendorID = vp.UserID
            WHERE oi.OrderID = @OrderID";
        using (SqlCommand cmd = new SqlCommand(query, conn))
        {
            cmd.Parameters.AddWithValue("@OrderID", orderId);
            using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    items.Add(new OrderItemWithVendor
                    {
                        OrderItemId = reader.GetInt32(reader.GetOrdinal("OrderItemID")),
                        ProductId = reader.GetInt32(reader.GetOrdinal("ProductID")),
                        ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                        VendorId = reader.GetInt32(reader.GetOrdinal("VendorID")),
                        VendorName = reader.GetString(reader.GetOrdinal("VendorName")),
                        Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                        UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                        TotalPrice = reader.GetDecimal(reader.GetOrdinal("TotalPrice")),
                        ItemStatus = reader.GetString(reader.GetOrdinal("ItemStatus"))
                    });
                }
            }
        }
    }

    // 3. Get customer email & phone
    string customerEmail = "", customerPhone = "";
    using (SqlConnection conn = new SqlConnection(_connectionString))
    {
        using (SqlCommand cmd = new SqlCommand("SELECT Email, PhoneNumber FROM Users WHERE UserID = @UserID", conn))
        {
            cmd.Parameters.AddWithValue("@UserID", customerId);
            await conn.OpenAsync();
            using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    customerEmail = reader.GetString(reader.GetOrdinal("Email"));
                    customerPhone = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? "" : reader.GetString(reader.GetOrdinal("PhoneNumber"));
                }
            }
        }
    }

    return new AdminOrderDetail
    {
        OrderId = orderDetail.OrderId,
        CustomerId = customerId,
        OrderDate = orderDetail.OrderDate,
        OrderStatus = orderDetail.OrderStatus,
        PaymentStatus = orderDetail.PaymentStatus,
        PaymentMethod = orderDetail.PaymentMethod,
        SubTotal = orderDetail.SubTotal,
        ShippingCost = orderDetail.ShippingCost,
        TaxAmount = orderDetail.TaxAmount,
        DiscountAmount = orderDetail.DiscountAmount,
        TotalAmount = orderDetail.TotalAmount,
        AddressLine1 = orderDetail.AddressLine1,
        AddressLine2 = orderDetail.AddressLine2,
        City = orderDetail.City,
        State = orderDetail.State,
        ZipCode = orderDetail.ZipCode,
        Country = orderDetail.Country,
        CustomerEmail = customerEmail,
        CustomerPhone = customerPhone,
        Items = items
    };
}

// ========== DISPUTES ==========
public async Task<int> CreateDispute(int userId, CreateDisputeModel model)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_CreateDispute", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
        cmd.Parameters.AddWithValue("@CustomerID", model.UserType == "Customer" ? userId : (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@VendorID", model.UserType == "Vendor" ? userId : (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Reason", model.Reason);
        cmd.Parameters.AddWithValue("@Status", "Pending");
        await conn.OpenAsync();
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}

public async Task<List<DisputeListItem>> GetAllDisputes(string? status = null)
{
    var disputes = new List<DisputeListItem>();
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_GetAllDisputes", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Status", (object)status ?? DBNull.Value);
        await conn.OpenAsync();
        using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                disputes.Add(new DisputeListItem
                {
                    DisputeId = reader.GetInt32(reader.GetOrdinal("DisputeID")),
                    OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                    OrderNumber = reader.GetString(reader.GetOrdinal("OrderNumber")),
                    CustomerId = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                    CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                    VendorId = reader.IsDBNull(reader.GetOrdinal("VendorID")) ? null : reader.GetInt32(reader.GetOrdinal("VendorID")),
                    VendorName = reader.IsDBNull(reader.GetOrdinal("VendorName")) ? null : reader.GetString(reader.GetOrdinal("VendorName")),
                    Reason = reader.GetString(reader.GetOrdinal("Reason")),
                    Status = reader.GetString(reader.GetOrdinal("Status")),
                    CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                    AdminNotes = reader.IsDBNull(reader.GetOrdinal("AdminNotes")) ? null : reader.GetString(reader.GetOrdinal("AdminNotes")),
                    ResolvedDate = reader.IsDBNull(reader.GetOrdinal("ResolvedDate")) ? null : reader.GetDateTime(reader.GetOrdinal("ResolvedDate"))
                });
            }
        }
    }
    return disputes;
}

public async Task<bool> ResolveDispute(int disputeId, ResolveDisputeModel model)
{
    using (SqlConnection conn = new SqlConnection(_connectionString))
    using (SqlCommand cmd = new SqlCommand("sp_ResolveDispute", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@DisputeID", disputeId);
        cmd.Parameters.AddWithValue("@AdminNotes", model.AdminNotes);
        cmd.Parameters.AddWithValue("@Action", model.Action);
        await conn.OpenAsync();
        int rows = await cmd.ExecuteNonQueryAsync();
        return rows > 0;
    }
}

        // ========== INNER CLASSES (Models) ==========

        public class VendorDocument
        {
            public int DocumentID { get; set; }
            public int UserID { get; set; }
            public string DocumentType { get; set; }
            public string FileName { get; set; }
            public string FilePath { get; set; }
            public int? FileSize { get; set; }
            public string? ContentType { get; set; }
            public DateTime UploadedDate { get; set; }
            public bool IsVerified { get; set; }
        }

        public class CartItem
        {
            public int CartId { get; set; }
            public int ProductId { get; set; }
            public string ProductName { get; set; }
            public decimal Price { get; set; }
            public decimal DiscountPercent { get; set; }
            public string? ImageUrl { get; set; }
            public int Quantity { get; set; }
            public string VendorName { get; set; }
            public decimal ItemTotal { get; set; }
            public int StockQuantity { get; set; }
        }

        public class CartSummary
        {
            public int VendorCount { get; set; }
            public int ItemCount { get; set; }
            public int TotalQuantity { get; set; }
            public decimal Subtotal { get; set; }
            public decimal EstimatedTax { get; set; }
            public decimal EstimatedShipping { get; set; }
        }

        public class Address
        {
            public int AddressId { get; set; }
            public string AddressLine1 { get; set; }
            public string? AddressLine2 { get; set; }
            public string City { get; set; }
            public string State { get; set; }
            public string ZipCode { get; set; }
            public string Country { get; set; }
            public bool IsDefault { get; set; }
        }

        public class CustomerOrder
        {
            public int OrderId { get; set; }
            public DateTime OrderDate { get; set; }
            public string OrderStatus { get; set; }
            public string PaymentStatus { get; set; }
            public decimal TotalAmount { get; set; }
            public int ItemCount { get; set; }
        }

        public class OrderItem
        {
            public int OrderItemId { get; set; }
            public int ProductId { get; set; }
            public string ProductName { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalPrice { get; set; }
            public string ItemStatus { get; set; }
            public string VendorName { get; set; }
        }

        public class VendorProduct
        {
            public int ProductId { get; set; }
            public int CategoryId { get; set; }
            public string CategoryName { get; set; }
            public string ProductName { get; set; }
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public int StockQuantity { get; set; }
            public decimal DiscountPercent { get; set; }
            public string? Sku { get; set; }
            public string? ImageUrl { get; set; }
            public bool IsActive { get; set; }
        }

        public class VendorOrder
        {
            public int OrderId { get; set; }
            public string CustomerName { get; set; }
            public DateTime OrderDate { get; set; }
            public string OrderStatus { get; set; }
            public decimal TotalAmount { get; set; }
            public List<VendorOrderItem> Items { get; set; }
        }

        public class VendorOrderItem
        {
            public int OrderItemId { get; set; }
            public int ProductId { get; set; }
            public string ProductName { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalPrice { get; set; }
            public string ItemStatus { get; set; }
        }

        public class VendorRevenueSummary
        {
            public decimal TotalSales { get; set; }
            public decimal MonthlySales { get; set; }
            public decimal PendingPayments { get; set; }
            public int TotalOrders { get; set; }
            public decimal AverageOrderValue { get; set; }
            public int PendingOrders { get; set; }
            public int ShippedOrders { get; set; }
            public int DeliveredOrders { get; set; }
        }

        public class VendorTransaction
        {
            public int OrderId { get; set; }
            public string CustomerName { get; set; }
            public DateTime OrderDate { get; set; }
            public string OrderStatus { get; set; }
            public string PaymentStatus { get; set; }
            public decimal TotalAmount { get; set; }
        }

        public class ChartData
        {
            public string Label { get; set; }
            public decimal TotalRevenue { get; set; }
        }

        public class Product
        {
            public int ProductId { get; set; }
            public int VendorId { get; set; }
            public int CategoryId { get; set; }
            public string CategoryName { get; set; }
            public string ProductName { get; set; }
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public int StockQuantity { get; set; }
            public decimal DiscountPercent { get; set; }
            public string? Sku { get; set; }
            public string? ImageUrl { get; set; }
            public bool IsActive { get; set; }
            public string BusinessName { get; set; }
            public decimal AverageRating { get; set; }
            public int ReviewCount { get; set; }
        }

        public class ProductListResult
        {
            public List<Product> Products { get; set; } = new();
            public int TotalCount { get; set; }
            public int TotalPages { get; set; }
        }

        public class Review
        {
            public int ReviewId { get; set; }
            public int Rating { get; set; }
            public string? Comment { get; set; }
            public string CustomerName { get; set; }
            public DateTime CreatedDate { get; set; }
        }

        public class Category
        {
            public int CategoryId { get; set; }
            public string CategoryName { get; set; }
            public string? Description { get; set; }
            public int? ParentCategoryId { get; set; }
            public string? ImageUrl { get; set; }
            public bool IsActive { get; set; }
            public int ProductCount { get; set; }
        }

        public class AdminVendor
        {
            public int UserId { get; set; }
            public string BusinessName { get; set; }
            public string OwnerName { get; set; }
            public string Email { get; set; }
            public string TaxId { get; set; }
            public string? BusinessPhone { get; set; }
            public string ApprovalStatus { get; set; }
            public DateTime RegisteredDate { get; set; }
            public bool IsActive { get; set; }
        }

        public class VendorListItem
        {
            public int UserID { get; set; }
            public string BusinessName { get; set; }
            public string OwnerName { get; set; }
            public string Email { get; set; }
            public string TaxID { get; set; }
            public string? BusinessPhone { get; set; }
            public DateTime RegisteredDate { get; set; }
            public string ApprovalStatus { get; set; }
        }

        public class SalesReportRow
        {
            public string Period { get; set; }
            public int TotalOrders { get; set; }
            public decimal TotalRevenue { get; set; }
            public decimal TotalSubTotal { get; set; }
            public decimal TotalShipping { get; set; }
            public decimal TotalTax { get; set; }
            public decimal AverageOrderValue { get; set; }
            public int UniqueCustomers { get; set; }
        }

        public class TopVendor
        {
            public string BusinessName { get; set; }
            public int TotalOrders { get; set; }
            public decimal TotalRevenue { get; set; }
        }

        public class TopProduct
        {
            public string ProductName { get; set; }
            public int TotalQuantitySold { get; set; }
            public decimal TotalRevenue { get; set; }
        }

        public class DashboardStats
        {
            public int TotalCustomers { get; set; }
            public int TotalVendors { get; set; }
            public int TotalProducts { get; set; }
            public int TodayOrders { get; set; }
            public decimal TodayRevenue { get; set; }
            public int PendingOrders { get; set; }
            public int PendingVendors { get; set; }
            public int PendingReviews { get; set; }
        }

        public class VendorProfile
        {
            public string? ApprovalStatus { get; set; }
        }
    }
}