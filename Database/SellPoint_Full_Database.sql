-- =============================================================
-- SellPoint Full Database Script
--
-- Author: Student Name
-- Environment: Microsoft SQL Server
--
-- Contents:
--  - Schema: Users, Vendors, Customers, Admins, Categories, Products, Orders, Payments
--  - Supporting tables: Addresses, ShoppingCart, Reviews, LoginHistory, PasswordResetHistory
--  - Reporting & admin stored procedures and indexes
--  - Order flow and dispute management additions
--
-- Run instructions (recommended):
--  1) Open in SQL Server Management Studio (SSMS) or run with `sqlcmd`.
--  2) The script drops and creates a database named `SellPoint_db`.
--     If you want to keep an existing DB, edit the database name or comment out
--     the initial DROP/CREATE block.
--  3) Execute the script as a single batch. `GO` separators are used where
--     appropriate — keep them intact.
--
-- =============================================================

-- Drop database if exists (for fresh start)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SellPoint_db')
BEGIN
    ALTER DATABASE SellPoint_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SellPoint_db;
END
GO

-- Create database
CREATE DATABASE SellPoint_db;
GO

USE SellPoint_db;
GO

-- =============================================
-- TABLES
-- =============================================

-- Users Table (Enhanced)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    DateOfBirth DATE,
    UserType NVARCHAR(20) DEFAULT 'Customer', -- 'Customer', 'Vendor', 'Admin'
    IsActive BIT DEFAULT 1,
    IsEmailVerified BIT DEFAULT 1,
    EmailVerificationToken NVARCHAR(100),
    PasswordResetToken NVARCHAR(100),
    PasswordResetTokenExpiry DATETIME,
    LastLoginDate DATETIME,
    FailedLoginAttempts INT DEFAULT 0,
    IsLocked BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
);
GO

-- VendorProfiles Table
CREATE TABLE VendorProfiles (
    VendorProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BusinessName NVARCHAR(100) NOT NULL,
    TaxID NVARCHAR(50) NOT NULL,
    BusinessPhone NVARCHAR(20),
    BusinessEmail NVARCHAR(100),
    Website NVARCHAR(100),
    BusinessDescription NVARCHAR(500),
    ApprovalStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Suspended'
    ApprovedBy INT NULL,
    ApprovedDate DATETIME,
    RejectionReason NVARCHAR(255),
    UploadToken NVARCHAR(100) NULL,
    UploadTokenExpiry DATETIME NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_VendorProfiles_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_VendorProfiles_UserID UNIQUE (UserID)
);
GO

-- Vendor Documents Table
CREATE TABLE VendorDocuments (
    DocumentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    DocumentType NVARCHAR(50) NOT NULL, -- 'BusinessLicense', 'TaxCertificate', etc.
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileSize INT,
    ContentType NVARCHAR(100),
    UploadedDate DATETIME DEFAULT GETDATE(),
    IsVerified BIT DEFAULT 0,
    CONSTRAINT FK_VendorDocuments_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- CustomerProfiles Table
CREATE TABLE CustomerProfiles (
    CustomerProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    LoyaltyPoints INT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CustomerProfiles_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_CustomerProfiles_UserID UNIQUE (UserID)
);
GO

-- AdminProfiles Table
CREATE TABLE AdminProfiles (
    AdminProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Department NVARCHAR(100),
    JobTitle NVARCHAR(100),
    Permissions NVARCHAR(MAX) DEFAULT '["manage_vendors","manage_categories","view_reports","manage_orders"]',
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AdminProfiles_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_AdminProfiles_UserID UNIQUE (UserID)
);
GO

-- =============================================
-- NEW TABLES FOR FULL PROJECT
-- =============================================

-- Categories Table
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    ParentCategoryID INT NULL,
    ImageUrl NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
);
GO

-- Products Table
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    VendorID INT NOT NULL,
    CategoryID INT NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    StockQuantity INT NOT NULL DEFAULT 0,
    DiscountPercent DECIMAL(5,2) DEFAULT 0,
    SKU NVARCHAR(50) UNIQUE,
    ImageUrl NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Products_Vendor FOREIGN KEY (VendorID) REFERENCES Users(UserID),
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT CHK_Price CHECK (Price >= 0),
    CONSTRAINT CHK_Stock CHECK (StockQuantity >= 0),
    CONSTRAINT CHK_Discount CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100)
);
GO

-- ProductImages Table (Multiple images per product)
CREATE TABLE ProductImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageUrl NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    CONSTRAINT FK_ProductImages_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);
GO

-- ShoppingCart Table
CREATE TABLE ShoppingCart (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    AddedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Cart_Customer FOREIGN KEY (CustomerID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT FK_Cart_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT CHK_CartQuantity CHECK (Quantity > 0)
);
GO

-- Addresses Table (Customer shipping addresses)
CREATE TABLE Addresses (
    AddressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    AddressLine1 NVARCHAR(255) NOT NULL,
    AddressLine2 NVARCHAR(255),
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    ZipCode NVARCHAR(20) NOT NULL,
    Country NVARCHAR(100) DEFAULT 'Pakistan',
    IsDefault BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Addresses_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- Orders Table
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    AddressID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    OrderStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed', 'Refunded'
    PaymentMethod NVARCHAR(50), -- 'CreditCard', 'DebitCard', 'CashOnDelivery', 'BankTransfer'
    SubTotal DECIMAL(18,2) NOT NULL,
    ShippingCost DECIMAL(18,2) DEFAULT 0,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL,
    TrackingNumber NVARCHAR(100),
    Notes NVARCHAR(500),
    EstimatedDeliveryDate DATE NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
    CONSTRAINT FK_Orders_Address FOREIGN KEY (AddressID) REFERENCES Addresses(AddressID),
    CONSTRAINT CHK_SubTotal CHECK (SubTotal >= 0),
    CONSTRAINT CHK_Total CHECK (TotalAmount >= 0)
);
GO

-- OrderItems Table
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    VendorID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TotalPrice DECIMAL(18,2) NOT NULL,
    ItemStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Shipped', 'Delivered', 'Returned'
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_OrderItems_Vendor FOREIGN KEY (VendorID) REFERENCES Users(UserID),
    CONSTRAINT CHK_OrderItemQuantity CHECK (Quantity > 0),
    CONSTRAINT CHK_UnitPrice CHECK (UnitPrice >= 0)
);
GO

-- Payments Table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL,
    TransactionID NVARCHAR(100),
    Amount DECIMAL(18,2) NOT NULL,
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Completed', 'Failed', 'Refunded'
    PaymentDate DATETIME,
    FailureReason NVARCHAR(255),
    CreatedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Payments_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
GO

-- Reviews Table
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    CustomerID INT NOT NULL,
    OrderItemID INT NOT NULL,
    Rating INT NOT NULL, -- 1-5
    Comment NVARCHAR(MAX),
    IsApproved BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Reviews_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_Reviews_Customer FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
    CONSTRAINT FK_Reviews_OrderItem FOREIGN KEY (OrderItemID) REFERENCES OrderItems(OrderItemID),
    CONSTRAINT CHK_Rating CHECK (Rating >= 1 AND Rating <= 5)
);
GO

-- Password Reset History Table
CREATE TABLE PasswordResetHistory (
    ResetID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ResetToken NVARCHAR(100),
    RequestedDate DATETIME DEFAULT GETDATE(),
    IsUsed BIT DEFAULT 0,
    UsedDate DATETIME,
    ExpiryDate DATETIME,
    CONSTRAINT FK_PasswordResetHistory_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- Login History Table
CREATE TABLE LoginHistory (
    LoginID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    LoginTime DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    LoginStatus NVARCHAR(20), -- 'Success', 'Failed', 'Attempt'
    CONSTRAINT FK_LoginHistory_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- OrderStatusHistory Table (Track order status changes)
CREATE TABLE OrderStatusHistory (
    StatusHistoryID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PreviousStatus NVARCHAR(20),
    NewStatus NVARCHAR(20),
    ChangedBy INT, -- UserID who changed it
    ChangeDate DATETIME DEFAULT GETDATE(),
    Notes NVARCHAR(255),
    CONSTRAINT FK_OrderStatusHistory_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE
);
GO

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_UserType ON Users(UserType);
CREATE INDEX IX_Users_PasswordResetToken ON Users(PasswordResetToken);
CREATE INDEX IX_VendorProfiles_ApprovalStatus ON VendorProfiles(ApprovalStatus);
CREATE INDEX IX_VendorProfiles_BusinessName ON VendorProfiles(BusinessName);
CREATE INDEX IX_VendorDocuments_UserID ON VendorDocuments(UserID);
CREATE INDEX IX_PasswordResetHistory_Token ON PasswordResetHistory(ResetToken);
CREATE INDEX IX_Categories_Parent ON Categories(ParentCategoryID);
CREATE INDEX IX_Products_Vendor ON Products(VendorID);
CREATE INDEX IX_Products_Category ON Products(CategoryID);
CREATE INDEX IX_Products_Active ON Products(IsActive);
CREATE INDEX IX_Products_Price_Active ON Products(Price, IsActive);
CREATE INDEX IX_ShoppingCart_Customer ON ShoppingCart(CustomerID);
CREATE INDEX IX_Orders_Customer ON Orders(CustomerID);
CREATE INDEX IX_Orders_Status ON Orders(OrderStatus);
CREATE INDEX IX_Orders_Date ON Orders(OrderDate);
CREATE INDEX IX_OrderItems_Order ON OrderItems(OrderID);
CREATE INDEX IX_OrderItems_Vendor ON OrderItems(VendorID);
CREATE INDEX IX_Reviews_Product ON Reviews(ProductID);
CREATE INDEX IX_Reviews_Customer ON Reviews(CustomerID);
CREATE INDEX IX_Payments_Order ON Payments(OrderID);
GO

-- =============================================
-- STORED PROCEDURES - AUTH & USER MANAGEMENT
-- =============================================

-- SP: Check User Exists
CREATE PROCEDURE sp_CheckUserExists
    @Username NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM Users WHERE Username = @Username) THEN 1 ELSE 0 END AS UsernameExists,
        CASE WHEN EXISTS (SELECT 1 FROM Users WHERE Email = @Email) THEN 1 ELSE 0 END AS EmailExists;
END;
GO

-- SP: Validate User Login
CREATE PROCEDURE sp_ValidateUserLogin
    @UsernameOrEmail NVARCHAR(100),
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        UserID, FirstName, LastName, Email, Username, 
        PasswordHash, UserType, IsEmailVerified, IsActive,
        FailedLoginAttempts, IsLocked
    FROM Users 
    WHERE (Username = @UsernameOrEmail OR Email = @UsernameOrEmail);

    IF @@ROWCOUNT > 0
    BEGIN
        INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, LoginStatus)
        SELECT UserID, @IPAddress, @UserAgent, 'Attempt'
        FROM Users 
        WHERE (Username = @UsernameOrEmail OR Email = @UsernameOrEmail);
    END
END;
GO

-- SP: Register User
CREATE PROCEDURE sp_RegisterUser
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @Username NVARCHAR(50),
    @PasswordHash NVARCHAR(255),
    @PhoneNumber NVARCHAR(20) = NULL,
    @DateOfBirth DATE = NULL,
    @UserType NVARCHAR(20) = 'Customer'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO Users (FirstName, LastName, Email, Username, PasswordHash, PhoneNumber, DateOfBirth, UserType, IsEmailVerified)
        VALUES (@FirstName, @LastName, @Email, @Username, @PasswordHash, @PhoneNumber, @DateOfBirth, @UserType, 1);
        SELECT SCOPE_IDENTITY() AS UserID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Create Vendor Profile
CREATE OR ALTER PROCEDURE sp_CreateVendorProfile
    @UserID INT,
    @BusinessName NVARCHAR(100),
    @TaxID NVARCHAR(50),
    @BusinessPhone NVARCHAR(20) = NULL,
    @BusinessEmail NVARCHAR(100) = NULL,
    @Website NVARCHAR(100) = NULL,
    @BusinessDescription NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UploadToken NVARCHAR(100) = NEWID();
    DECLARE @Expiry DATETIME = DATEADD(HOUR, 1, GETDATE());

    INSERT INTO VendorProfiles (UserID, BusinessName, TaxID, BusinessPhone, BusinessEmail, Website, BusinessDescription, UploadToken, UploadTokenExpiry)
    VALUES (@UserID, @BusinessName, @TaxID, @BusinessPhone, @BusinessEmail, @Website, @BusinessDescription, @UploadToken, @Expiry);
    
    SELECT SCOPE_IDENTITY() AS VendorProfileID, @UploadToken AS UploadToken;
END;
GO

-- SP: Upload Vendor Document
CREATE PROCEDURE sp_UploadVendorDocument
    @UserID INT,
    @DocumentType NVARCHAR(50),
    @FileName NVARCHAR(255),
    @FilePath NVARCHAR(500),
    @FileSize INT = NULL,
    @ContentType NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO VendorDocuments (UserID, DocumentType, FileName, FilePath, FileSize, ContentType)
    VALUES (@UserID, @DocumentType, @FileName, @FilePath, @FileSize, @ContentType);
    SELECT SCOPE_IDENTITY() AS DocumentID;
END;
GO

-- SP: Create Customer Profile
CREATE PROCEDURE sp_CreateCustomerProfile
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO CustomerProfiles (UserID) VALUES (@UserID);
        SELECT SCOPE_IDENTITY() AS CustomerProfileID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Create Admin Profile
CREATE PROCEDURE sp_CreateAdminProfile
    @UserID INT,
    @Department NVARCHAR(100) = NULL,
    @JobTitle NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE Users SET UserType = 'Admin' WHERE UserID = @UserID;
        INSERT INTO AdminProfiles (UserID, Department, JobTitle)
        VALUES (@UserID, @Department, @JobTitle);
        SELECT SCOPE_IDENTITY() AS AdminProfileID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Update Login Success
CREATE PROCEDURE sp_UpdateLoginSuccess
    @UserID INT,
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET FailedLoginAttempts = 0, LastLoginDate = GETDATE(), ModifiedDate = GETDATE()
    WHERE UserID = @UserID;
    INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, LoginStatus)
    VALUES (@UserID, @IPAddress, @UserAgent, 'Success');
END;
GO

-- SP: Update Login Failure
CREATE PROCEDURE sp_UpdateLoginFailure
    @UsernameOrEmail NVARCHAR(100),
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID = UserID FROM Users WHERE Username = @UsernameOrEmail OR Email = @UsernameOrEmail;
    IF @UserID IS NOT NULL
    BEGIN
        UPDATE Users 
        SET FailedLoginAttempts = FailedLoginAttempts + 1, ModifiedDate = GETDATE()
        WHERE UserID = @UserID;
        IF (SELECT FailedLoginAttempts FROM Users WHERE UserID = @UserID) >= 5
        BEGIN
            UPDATE Users SET IsLocked = 1 WHERE UserID = @UserID;
        END
        INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, LoginStatus)
        VALUES (@UserID, @IPAddress, @UserAgent, 'Failed');
    END
END;
GO

-- SP: Request Password Reset
CREATE PROCEDURE sp_RequestPasswordReset
    @Email NVARCHAR(100),
    @ResetToken NVARCHAR(100),
    @ExpiryHours INT = 24
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID = UserID FROM Users WHERE Email = @Email AND IsActive = 1;
    IF @UserID IS NOT NULL
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE Users 
            SET PasswordResetToken = @ResetToken, PasswordResetTokenExpiry = DATEADD(HOUR, @ExpiryHours, GETDATE())
            WHERE UserID = @UserID;
            INSERT INTO PasswordResetHistory (UserID, ResetToken, ExpiryDate)
            VALUES (@UserID, @ResetToken, DATEADD(HOUR, @ExpiryHours, GETDATE()));
            COMMIT TRANSACTION;
            SELECT @UserID AS UserID;
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH
    END
    ELSE
    BEGIN
        SELECT NULL AS UserID;
    END
END;
GO

-- SP: Validate Reset Token
CREATE PROCEDURE sp_ValidateResetToken
    @ResetToken NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.UserID, u.Email, u.Username, u.PasswordResetTokenExpiry
    FROM Users u
    WHERE u.PasswordResetToken = @ResetToken AND u.PasswordResetTokenExpiry > GETDATE() AND u.IsActive = 1;
END;
GO

-- SP: Reset Password
CREATE PROCEDURE sp_ResetPassword
    @ResetToken NVARCHAR(100),
    @NewPasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID = UserID FROM Users WHERE PasswordResetToken = @ResetToken AND PasswordResetTokenExpiry > GETDATE() AND IsActive = 1;
    IF @UserID IS NOT NULL
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE Users 
            SET PasswordHash = @NewPasswordHash, PasswordResetToken = NULL, PasswordResetTokenExpiry = NULL,
                FailedLoginAttempts = 0, IsLocked = 0, ModifiedDate = GETDATE()
            WHERE UserID = @UserID;
            UPDATE PasswordResetHistory SET IsUsed = 1, UsedDate = GETDATE() WHERE ResetToken = @ResetToken;
            COMMIT TRANSACTION;
            SELECT @UserID AS UserID;
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH
    END
    ELSE
    BEGIN
        SELECT NULL AS UserID;
    END
END;
GO

-- SP: Get User Profile
CREATE PROCEDURE sp_GetUserProfile
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.UserID, u.FirstName, u.LastName, u.Email, u.Username,
        u.PhoneNumber, u.DateOfBirth, u.UserType, u.IsEmailVerified, u.IsActive,
        u.FailedLoginAttempts, u.IsLocked,
        cp.LoyaltyPoints,
        vp.BusinessName, vp.TaxID, vp.BusinessPhone, vp.BusinessEmail,
        vp.Website, vp.BusinessDescription, vp.ApprovalStatus,
        ap.Department, ap.JobTitle, ap.Permissions
    FROM Users u
    LEFT JOIN CustomerProfiles cp ON u.UserID = cp.UserID
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    LEFT JOIN AdminProfiles ap ON u.UserID = ap.UserID
    WHERE u.UserID = @UserID;
END;
GO

-- SP: Get Vendor Documents
CREATE PROCEDURE sp_GetVendorDocuments
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DocumentID, DocumentType, FileName, FilePath, FileSize, ContentType, UploadedDate, IsVerified
    FROM VendorDocuments WHERE UserID = @UserID ORDER BY UploadedDate DESC;
END;
GO

-- =============================================
-- STORED PROCEDURES - ADMIN
-- =============================================

-- SP: Get Pending Vendors
CREATE PROCEDURE sp_GetPendingVendors
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.UserID,
        vp.BusinessName,
        CONCAT(u.FirstName, ' ', u.LastName) AS OwnerName,
        u.Email,
        vp.TaxID,
        vp.BusinessPhone,
        u.CreatedDate AS RegisteredDate,
        vp.ApprovalStatus
    FROM Users u
    INNER JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE vp.ApprovalStatus = 'Pending' AND u.IsActive = 1
    ORDER BY u.CreatedDate DESC;
END;
GO

-- SP: Update Vendor Approval
CREATE PROCEDURE sp_UpdateVendorApproval
    @UserID INT,
    @ApprovedBy INT,
    @Status NVARCHAR(20), -- 'Approved', 'Rejected', 'Suspended'
    @RejectionReason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE VendorProfiles 
        SET ApprovalStatus = @Status, ApprovedBy = @ApprovedBy, ApprovedDate = GETDATE(), 
            RejectionReason = @RejectionReason, ModifiedDate = GETDATE()
        WHERE UserID = @UserID;

        IF @Status = 'Approved'
        BEGIN
            UPDATE Users SET UserType = 'Vendor', ModifiedDate = GETDATE() WHERE UserID = @UserID;
        END

        SELECT @@ROWCOUNT AS RowsAffected;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Get All Vendors (for admin)
CREATE PROCEDURE sp_GetAllVendors
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.UserID,
        vp.BusinessName,
        CONCAT(u.FirstName, ' ', u.LastName) AS OwnerName,
        u.Email,
        vp.TaxID,
        vp.BusinessPhone,
        vp.ApprovalStatus,
        vp.ApprovedDate,
        vp.RejectionReason,
        u.CreatedDate AS RegisteredDate,
        u.IsActive
    FROM Users u
    INNER JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE (@Status IS NULL OR vp.ApprovalStatus = @Status)
    ORDER BY u.CreatedDate DESC;
END;
GO

-- SP: Toggle User Status (for vendor suspension/activation)
CREATE PROCEDURE sp_ToggleUserStatus
    @UserID INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE Users 
        SET IsActive = @IsActive, 
            ModifiedDate = GETDATE() 
        WHERE UserID = @UserID;
        
        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        SELECT 0 AS RowsAffected;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- STORED PROCEDURES - CATEGORIES (UPDATED)
-- =============================================

-- SP: Create Category (UPDATED - includes all columns)
CREATE PROCEDURE sp_CreateCategory
    @CategoryName NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @ParentCategoryID INT = NULL,
    @ImageUrl NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Categories (CategoryName, Description, ParentCategoryID, ImageUrl, IsActive, CreatedDate, ModifiedDate)
    VALUES (@CategoryName, @Description, @ParentCategoryID, @ImageUrl, 1, GETDATE(), GETDATE());
    SELECT SCOPE_IDENTITY() AS CategoryID;
END;
GO

-- SP: Update Category (UPDATED)
CREATE PROCEDURE sp_UpdateCategory
    @CategoryID INT,
    @CategoryName NVARCHAR(100),
    @Description NVARCHAR(500) = NULL,
    @ParentCategoryID INT = NULL,
    @ImageUrl NVARCHAR(255) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Categories 
    SET CategoryName = @CategoryName, 
        Description = @Description, 
        ParentCategoryID = @ParentCategoryID,
        ImageUrl = @ImageUrl, 
        IsActive = @IsActive, 
        ModifiedDate = GETDATE()
    WHERE CategoryID = @CategoryID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Delete Category (soft delete by setting inactive)
CREATE PROCEDURE sp_DeleteCategory
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Check if category has products
    IF EXISTS (SELECT 1 FROM Products WHERE CategoryID = @CategoryID AND IsActive = 1)
    BEGIN
        SELECT 0 AS Success, 'Cannot delete category with active products' AS Message;
        RETURN;
    END
    UPDATE Categories SET IsActive = 0, ModifiedDate = GETDATE() WHERE CategoryID = @CategoryID;
    SELECT 1 AS Success, 'Category deleted successfully' AS Message;
END;
GO

-- SP: Get All Categories (UPDATED - includes ProductCount)
CREATE PROCEDURE sp_GetCategories
    @ParentCategoryID INT = NULL,
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.CategoryID, 
        c.CategoryName, 
        c.Description, 
        c.ParentCategoryID, 
        c.ImageUrl, 
        c.IsActive, 
        c.CreatedDate,
        (SELECT COUNT(*) FROM Products p WHERE p.CategoryID = c.CategoryID AND p.IsActive = 1) AS ProductCount
    FROM Categories c
    WHERE (@IncludeInactive = 1 OR c.IsActive = 1)
      AND (@ParentCategoryID IS NULL OR c.ParentCategoryID = @ParentCategoryID)
    ORDER BY c.CategoryName;
END;
GO

-- SP: Get Category By ID (UPDATED - includes ProductCount)
CREATE PROCEDURE sp_GetCategoryById
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.CategoryID, 
        c.CategoryName, 
        c.Description, 
        c.ParentCategoryID, 
        c.ImageUrl, 
        c.IsActive, 
        c.CreatedDate,
        (SELECT COUNT(*) FROM Products p WHERE p.CategoryID = c.CategoryID AND p.IsActive = 1) AS ProductCount
    FROM Categories c
    WHERE c.CategoryID = @CategoryID;
END;
GO

-- =============================================
-- STORED PROCEDURES - PRODUCTS
-- =============================================

-- SP: Create Product
CREATE PROCEDURE sp_CreateProduct
    @VendorID INT,
    @CategoryID INT,
    @ProductName NVARCHAR(200),
    @Description NVARCHAR(MAX) = NULL,
    @Price DECIMAL(18,2),
    @StockQuantity INT = 0,
    @DiscountPercent DECIMAL(5,2) = 0,
    @SKU NVARCHAR(50) = NULL,
    @ImageUrl NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- Generate SKU if not provided
    IF @SKU IS NULL
    BEGIN
        SET @SKU = 'SP' + RIGHT('000000' + CAST((SELECT ISNULL(MAX(ProductID), 0) + 1 FROM Products) AS VARCHAR(10)), 6);
    END
    INSERT INTO Products (VendorID, CategoryID, ProductName, Description, Price, StockQuantity, DiscountPercent, SKU, ImageUrl)
    VALUES (@VendorID, @CategoryID, @ProductName, @Description, @Price, @StockQuantity, @DiscountPercent, @SKU, @ImageUrl);
    SELECT SCOPE_IDENTITY() AS ProductID;
END;
GO

-- SP: Update Product
CREATE PROCEDURE sp_UpdateProduct
    @ProductID INT,
    @CategoryID INT = NULL,
    @ProductName NVARCHAR(200) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Price DECIMAL(18,2) = NULL,
    @StockQuantity INT = NULL,
    @DiscountPercent DECIMAL(5,2) = NULL,
    @ImageUrl NVARCHAR(255) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products 
    SET CategoryID = ISNULL(@CategoryID, CategoryID),
        ProductName = ISNULL(@ProductName, ProductName),
        Description = ISNULL(@Description, Description),
        Price = ISNULL(@Price, Price),
        StockQuantity = ISNULL(@StockQuantity, StockQuantity),
        DiscountPercent = ISNULL(@DiscountPercent, DiscountPercent),
        ImageUrl = ISNULL(@ImageUrl, ImageUrl),
        IsActive = ISNULL(@IsActive, IsActive),
        ModifiedDate = GETDATE()
    WHERE ProductID = @ProductID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Delete Product (soft delete)
CREATE PROCEDURE sp_DeleteProduct
    @ProductID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products SET IsActive = 0, ModifiedDate = GETDATE() WHERE ProductID = @ProductID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Get Product By ID
CREATE PROCEDURE sp_GetProductById
    @ProductID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.ProductID, p.VendorID, p.CategoryID, p.ProductName, p.Description,
        p.Price, p.StockQuantity, p.DiscountPercent, p.SKU, p.ImageUrl, p.IsActive,
        p.CreatedDate, p.ModifiedDate,
        c.CategoryName,
        CONCAT(u.FirstName, ' ', u.LastName) AS VendorName,
        vp.BusinessName,
        ISNULL(CAST(AVG(CASE WHEN r.IsApproved = 1 THEN CAST(r.Rating AS DECIMAL(18,2)) ELSE NULL END) AS DECIMAL(18,2)), 0.00) AS AverageRating,
        COUNT(CASE WHEN r.IsApproved = 1 THEN 1 ELSE NULL END) AS ReviewCount
    FROM Products p
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN Users u ON p.VendorID = u.UserID
    INNER JOIN VendorProfiles vp ON u.UserID = vp.UserID
    LEFT JOIN Reviews r ON p.ProductID = r.ProductID
    WHERE p.ProductID = @ProductID
    GROUP BY 
        p.ProductID, p.VendorID, p.CategoryID, p.ProductName, p.Description,
        p.Price, p.StockQuantity, p.DiscountPercent, p.SKU, p.ImageUrl, p.IsActive,
        p.CreatedDate, p.ModifiedDate, c.CategoryName, u.FirstName, u.LastName, vp.BusinessName;
END;
GO

-- SP: Get All Products (with filters)
CREATE PROCEDURE sp_GetProducts
    @CategoryID INT = NULL,
    @VendorID INT = NULL,
    @MinPrice DECIMAL(18,2) = NULL,
    @MaxPrice DECIMAL(18,2) = NULL,
    @SearchTerm NVARCHAR(200) = NULL,
    @SortBy NVARCHAR(20) = 'CreatedDate',
    @SortOrder NVARCHAR(4) = 'DESC',
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT 
        p.ProductID, p.VendorID, p.CategoryID, p.ProductName, p.Description,
        p.Price, p.StockQuantity, p.DiscountPercent, p.SKU, p.ImageUrl, p.IsActive,
        p.CreatedDate,
        c.CategoryName,
        CONCAT(u.FirstName, ' ', u.LastName) AS VendorName,
        vp.BusinessName,
        ISNULL(AVG(r.Rating), CAST(0 AS DECIMAL(18,2))) AS AverageRating,
        COUNT(r.ReviewID) AS ReviewCount,
        COUNT(*) OVER() AS TotalCount   -- <-- ADD THIS LINE for total count
    FROM Products p
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN Users u ON p.VendorID = u.UserID
    INNER JOIN VendorProfiles vp ON u.UserID = vp.UserID
    LEFT JOIN Reviews r ON p.ProductID = r.ProductID AND r.IsApproved = 1
    WHERE p.IsActive = 1
      AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
      AND (@VendorID IS NULL OR p.VendorID = @VendorID)
      AND (@MinPrice IS NULL OR p.Price >= @MinPrice)
      AND (@MaxPrice IS NULL OR p.Price <= @MaxPrice)
      AND (@SearchTerm IS NULL OR p.ProductName LIKE '%' + @SearchTerm + '%' OR p.Description LIKE '%' + @SearchTerm + '%')
    GROUP BY p.ProductID, p.VendorID, p.CategoryID, p.ProductName, p.Description,
        p.Price, p.StockQuantity, p.DiscountPercent, p.SKU, p.ImageUrl, p.IsActive,
        p.CreatedDate, c.CategoryName, u.FirstName, u.LastName, vp.BusinessName
    ORDER BY 
        CASE WHEN @SortBy = 'Price' AND @SortOrder = 'ASC' THEN p.Price END ASC,
        CASE WHEN @SortBy = 'Price' AND @SortOrder = 'DESC' THEN p.Price END DESC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'ASC' THEN p.ProductName END ASC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'DESC' THEN p.ProductName END DESC,
        CASE WHEN @SortBy = 'CreatedDate' AND @SortOrder = 'ASC' THEN p.CreatedDate END ASC,
        CASE WHEN @SortBy = 'CreatedDate' AND @SortOrder = 'DESC' THEN p.CreatedDate END DESC,
        CASE WHEN @SortBy = 'Popularity' THEN COUNT(r.ReviewID) END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP: Get Products by Vendor
CREATE PROCEDURE sp_GetVendorProducts
    @VendorID INT,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.ProductID, p.CategoryID, p.ProductName, p.Description,
        p.Price, p.StockQuantity, p.DiscountPercent, p.SKU, p.ImageUrl, p.IsActive,
        p.CreatedDate, p.ModifiedDate,
        c.CategoryName
    FROM Products p
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE p.VendorID = @VendorID
      AND (@IsActive IS NULL OR p.IsActive = @IsActive)
    ORDER BY p.CreatedDate DESC;
END;
GO

-- SP: Update Product Stock
CREATE PROCEDURE sp_UpdateProductStock
    @ProductID INT,
    @QuantityChange INT,
    @Reason NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products 
    SET StockQuantity = StockQuantity + @QuantityChange, ModifiedDate = GETDATE()
    WHERE ProductID = @ProductID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- =============================================
-- STORED PROCEDURES - SHOPPING CART
-- =============================================

-- SP: Add to Cart
CREATE PROCEDURE sp_AddToCart
    @CustomerID INT,
    @ProductID INT,
    @Quantity INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM ShoppingCart WHERE CustomerID = @CustomerID AND ProductID = @ProductID)
    BEGIN
        UPDATE ShoppingCart SET Quantity = Quantity + @Quantity WHERE CustomerID = @CustomerID AND ProductID = @ProductID;
    END
    ELSE
    BEGIN
        INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity) VALUES (@CustomerID, @ProductID, @Quantity);
    END
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Update Cart Quantity
CREATE PROCEDURE sp_UpdateCartQuantity
    @CartID INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @Quantity <= 0
    BEGIN
        DELETE FROM ShoppingCart WHERE CartID = @CartID;
        SELECT 1 AS RowsAffected;
    END
    ELSE
    BEGIN
        UPDATE ShoppingCart SET Quantity = @Quantity WHERE CartID = @CartID;
        SELECT @@ROWCOUNT AS RowsAffected;
    END
END;
GO

-- SP: Remove from Cart
CREATE PROCEDURE sp_RemoveFromCart
    @CartID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM ShoppingCart WHERE CartID = @CartID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Clear Cart
CREATE PROCEDURE sp_ClearCart
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM ShoppingCart WHERE CustomerID = @CustomerID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Get Cart Items
CREATE PROCEDURE sp_GetCartItems
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        sc.CartID, sc.ProductID, sc.Quantity, sc.AddedDate,
        p.ProductName, p.Description, p.Price, p.DiscountPercent, p.ImageUrl, p.StockQuantity,
        c.CategoryName,
        vp.BusinessName AS VendorName,
        (p.Price * (1 - p.DiscountPercent/100) * sc.Quantity) AS ItemTotal
    FROM ShoppingCart sc
    INNER JOIN Products p ON sc.ProductID = p.ProductID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN VendorProfiles vp ON p.VendorID = vp.UserID
    WHERE sc.CustomerID = @CustomerID;
END;
GO

-- SP: Get Cart Total
CREATE PROCEDURE sp_GetCartTotal
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(DISTINCT p.VendorID) AS VendorCount,
        COUNT(sc.CartID) AS ItemCount,
        SUM(sc.Quantity) AS TotalQuantity,
        SUM(p.Price * (1 - p.DiscountPercent/100) * sc.Quantity) AS SubTotal,
        SUM(p.Price * (1 - p.DiscountPercent/100) * sc.Quantity * 0.10) AS EstimatedTax,
        COUNT(DISTINCT p.VendorID) * 5.00 AS EstimatedShipping
    FROM ShoppingCart sc
    INNER JOIN Products p ON sc.ProductID = p.ProductID
    WHERE sc.CustomerID = @CustomerID;
END;
GO

-- =============================================
-- STORED PROCEDURES - ADDRESSES
-- =============================================

-- SP: Add Address
CREATE PROCEDURE sp_AddAddress
    @UserID INT,
    @AddressLine1 NVARCHAR(255),
    @AddressLine2 NVARCHAR(255) = NULL,
    @City NVARCHAR(100),
    @State NVARCHAR(100),
    @ZipCode NVARCHAR(20),
    @Country NVARCHAR(100) = 'Pakistan',
    @IsDefault BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF @IsDefault = 1
    BEGIN
        UPDATE Addresses SET IsDefault = 0 WHERE UserID = @UserID;
    END
    INSERT INTO Addresses (UserID, AddressLine1, AddressLine2, City, State, ZipCode, Country, IsDefault)
    VALUES (@UserID, @AddressLine1, @AddressLine2, @City, @State, @ZipCode, @Country, @IsDefault);
    SELECT SCOPE_IDENTITY() AS AddressID;
END;
GO

-- SP: Get User Addresses
CREATE PROCEDURE sp_GetUserAddresses
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT AddressID, AddressLine1, AddressLine2, City, State, ZipCode, Country, IsDefault, CreatedDate
    FROM Addresses WHERE UserID = @UserID ORDER BY IsDefault DESC, CreatedDate DESC;
END;
GO

-- SP: Get Address By ID
CREATE PROCEDURE sp_GetAddressById
    @AddressID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT AddressID, UserID, AddressLine1, AddressLine2, City, State, ZipCode, Country, IsDefault
    FROM Addresses WHERE AddressID = @AddressID;
END;
GO

-- SP: Delete Address
CREATE PROCEDURE sp_DeleteAddress
    @AddressID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Addresses WHERE AddressID = @AddressID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- =============================================
-- STORED PROCEDURES - ORDERS
-- =============================================

-- SP: Create Order
CREATE PROCEDURE sp_CreateOrder
    @CustomerID INT,
    @AddressID INT,
    @PaymentMethod NVARCHAR(50),
    @SubTotal DECIMAL(18,2),
    @ShippingCost DECIMAL(18,2),
    @TaxAmount DECIMAL(18,2),
    @DiscountAmount DECIMAL(18,2),
    @TotalAmount DECIMAL(18,2),
    @Notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO Orders (CustomerID, AddressID, PaymentMethod, SubTotal, ShippingCost, TaxAmount, DiscountAmount, TotalAmount, Notes)
        VALUES (@CustomerID, @AddressID, @PaymentMethod, @SubTotal, @ShippingCost, @TaxAmount, @DiscountAmount, @TotalAmount, @Notes);

        DECLARE @OrderID INT = SCOPE_IDENTITY();

        INSERT INTO OrderStatusHistory (OrderID, PreviousStatus, NewStatus, ChangedBy, Notes)
        VALUES (@OrderID, NULL, 'Pending', @CustomerID, 'Order created');

        SELECT @OrderID AS OrderID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- SP: Add Order Item
CREATE PROCEDURE sp_AddOrderItem
    @OrderID INT,
    @ProductID INT,
    @VendorID INT,
    @Quantity INT,
    @UnitPrice DECIMAL(18,2),
    @DiscountAmount DECIMAL(18,2) = 0
AS
BEGIN
    DECLARE @TotalPrice DECIMAL(18,2) = (@UnitPrice * @Quantity) - @DiscountAmount;
    
    INSERT INTO OrderItems (OrderID, ProductID, VendorID, Quantity, UnitPrice, DiscountAmount, TotalPrice)
    VALUES (@OrderID, @ProductID, @VendorID, @Quantity, @UnitPrice, @DiscountAmount, @TotalPrice);
    
    -- Update product stock
    UPDATE Products SET StockQuantity = StockQuantity - @Quantity WHERE ProductID = @ProductID;
    
    SELECT SCOPE_IDENTITY() AS OrderItemID;
END;
GO

-- SP: Get Order By ID
CREATE PROCEDURE sp_GetOrderById
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        o.OrderID, o.CustomerID, o.AddressID, o.OrderDate, o.OrderStatus, o.PaymentStatus,
        o.PaymentMethod, o.SubTotal, o.ShippingCost, o.TaxAmount, o.DiscountAmount, o.TotalAmount,
        o.TrackingNumber, o.Notes, o.EstimatedDeliveryDate,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
        a.AddressLine1, a.AddressLine2, a.City, a.State, a.ZipCode, a.Country
    FROM Orders o
    INNER JOIN Users u ON o.CustomerID = u.UserID
    INNER JOIN Addresses a ON o.AddressID = a.AddressID
    WHERE o.OrderID = @OrderID;
END;
GO

-- SP: Get Order Items
CREATE PROCEDURE sp_GetOrderItems
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        oi.OrderItemID, oi.ProductID, oi.VendorID, oi.Quantity, oi.UnitPrice,
        oi.DiscountAmount, oi.TotalPrice, oi.ItemStatus,
        p.ProductName, p.ImageUrl,
        vp.BusinessName AS VendorName
    FROM OrderItems oi
    INNER JOIN Products p ON oi.ProductID = p.ProductID
    INNER JOIN VendorProfiles vp ON oi.VendorID = vp.UserID
    WHERE oi.OrderID = @OrderID;
END;
GO

-- SP: Get Customer Orders
CREATE PROCEDURE sp_GetCustomerOrders
    @CustomerID INT,
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        o.OrderID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount,
        o.TrackingNumber,
        COUNT(oi.OrderItemID) AS ItemCount
    FROM Orders o
    LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
    WHERE o.CustomerID = @CustomerID
      AND (@Status IS NULL OR o.OrderStatus = @Status)
    GROUP BY o.OrderID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount, o.TrackingNumber
    ORDER BY o.OrderDate DESC;
END;
GO

-- SP: Get Vendor Orders
CREATE PROCEDURE sp_GetVendorOrders
    @VendorID INT,
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        o.OrderID, o.CustomerID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount,
        oi.OrderItemID, oi.ProductID, oi.Quantity, oi.UnitPrice, oi.TotalPrice, oi.ItemStatus,
        p.ProductName,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName
    FROM Orders o
    INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID
    INNER JOIN Products p ON oi.ProductID = p.ProductID
    INNER JOIN Users u ON o.CustomerID = u.UserID
    WHERE oi.VendorID = @VendorID
      AND (@Status IS NULL OR oi.ItemStatus = @Status)
    ORDER BY o.OrderDate DESC;
END;
GO

-- SP: Update Order Status
CREATE PROCEDURE sp_UpdateOrderStatus
    @OrderID INT,
    @NewStatus NVARCHAR(20),
    @ChangedBy INT,
    @Notes NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PreviousStatus NVARCHAR(20);
    SELECT @PreviousStatus = OrderStatus FROM Orders WHERE OrderID = @OrderID;

    UPDATE Orders SET OrderStatus = @NewStatus, ModifiedDate = GETDATE() WHERE OrderID = @OrderID;

    INSERT INTO OrderStatusHistory (OrderID, PreviousStatus, NewStatus, ChangedBy, Notes)
    VALUES (@OrderID, @PreviousStatus, @NewStatus, @ChangedBy, @Notes);

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Update Order Item Status
CREATE PROCEDURE sp_UpdateOrderItemStatus
    @OrderItemID INT,
    @NewStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE OrderItems SET ItemStatus = @NewStatus WHERE OrderItemID = @OrderItemID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- SP: Get All Orders (Admin)
CREATE PROCEDURE sp_GetAllOrders
    @Status NVARCHAR(20) = NULL,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT 
        o.OrderID, o.CustomerID, o.OrderDate, o.OrderStatus, o.PaymentStatus,
        o.TotalAmount, o.TrackingNumber,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
        COUNT(oi.OrderItemID) AS ItemCount
    FROM Orders o
    INNER JOIN Users u ON o.CustomerID = u.UserID
    LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
    WHERE (@Status IS NULL OR o.OrderStatus = @Status)
      AND (@FromDate IS NULL OR CAST(o.OrderDate AS DATE) >= @FromDate)
      AND (@ToDate IS NULL OR CAST(o.OrderDate AS DATE) <= @ToDate)
    GROUP BY o.OrderID, o.CustomerID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount, o.TrackingNumber, u.FirstName, u.LastName
    ORDER BY o.OrderDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- =============================================
-- STORED PROCEDURES - PAYMENTS
-- =============================================

-- SP: Create Payment
CREATE PROCEDURE sp_CreatePayment
    @OrderID INT,
    @PaymentMethod NVARCHAR(50),
    @Amount DECIMAL(18,2),
    @TransactionID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Payments (OrderID, PaymentMethod, Amount, TransactionID, PaymentStatus, PaymentDate)
    VALUES (@OrderID, @PaymentMethod, @Amount, @TransactionID, 'Completed', GETDATE());

    UPDATE Orders SET PaymentStatus = 'Paid' WHERE OrderID = @OrderID;

    SELECT SCOPE_IDENTITY() AS PaymentID;
END;
GO

-- SP: Update Payment Status
CREATE PROCEDURE sp_UpdatePaymentStatus
    @PaymentID INT,
    @Status NVARCHAR(20),
    @FailureReason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Payments 
    SET PaymentStatus = @Status, FailureReason = @FailureReason, PaymentDate = CASE WHEN @Status = 'Completed' THEN GETDATE() ELSE PaymentDate END
    WHERE PaymentID = @PaymentID;

    DECLARE @OrderID INT;
    SELECT @OrderID = OrderID FROM Payments WHERE PaymentID = @PaymentID;
    UPDATE Orders SET PaymentStatus = @Status WHERE OrderID = @OrderID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- =============================================
-- STORED PROCEDURES - REVIEWS
-- =============================================

-- SP: Add Review
CREATE PROCEDURE sp_AddReview
    @ProductID INT,
    @CustomerID INT,
    @OrderItemID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM OrderItems oi 
                   INNER JOIN Orders o ON oi.OrderID = o.OrderID 
                   WHERE oi.OrderItemID = @OrderItemID AND o.CustomerID = @CustomerID AND oi.ItemStatus = 'Delivered')
    BEGIN
        SELECT 0 AS Success, 'You can only review delivered products you purchased' AS Message;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Reviews WHERE OrderItemID = @OrderItemID)
    BEGIN
        SELECT 0 AS Success, 'You have already reviewed this product' AS Message;
        RETURN;
    END

    INSERT INTO Reviews (ProductID, CustomerID, OrderItemID, Rating, Comment)
    VALUES (@ProductID, @CustomerID, @OrderItemID, @Rating, @Comment);

    SELECT 1 AS Success, 'Review submitted successfully' AS Message, SCOPE_IDENTITY() AS ReviewID;
END;
GO

-- SP: Approve Review (Admin)
CREATE PROCEDURE sp_ApproveReview
    @ReviewID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Reviews SET IsApproved = 1 WHERE ReviewID = @ReviewID;
    IF @@ROWCOUNT > 0
        SELECT 1 AS Success, 'Review approved' AS Message;
    ELSE
        SELECT 0 AS Success, 'Review not found' AS Message;
END;
GO

-- SP: Get Product Reviews
CREATE PROCEDURE sp_GetProductReviews
    @ProductID INT,
    @OnlyApproved BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        r.ReviewID, r.Rating, r.Comment, r.CreatedDate, r.IsApproved,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName
    FROM Reviews r
    INNER JOIN Users u ON r.CustomerID = u.UserID
    WHERE r.ProductID = @ProductID
      AND (@OnlyApproved = 0 OR r.IsApproved = 1)
    ORDER BY r.CreatedDate DESC;
END;
GO

-- SP: Get Pending Reviews (Admin)
CREATE PROCEDURE sp_GetPendingReviews
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        r.ReviewID, r.ProductID, r.Rating, r.Comment, r.CreatedDate,
        p.ProductName,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName
    FROM Reviews r
    INNER JOIN Products p ON r.ProductID = p.ProductID
    INNER JOIN Users u ON r.CustomerID = u.UserID
    WHERE r.IsApproved = 0
    ORDER BY r.CreatedDate DESC;
END;
GO

-- =============================================
-- STORED PROCEDURES - REPORTS
-- =============================================

-- SP: Get Invoice Data
CREATE PROCEDURE sp_GetInvoiceData
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        o.OrderID,
        o.OrderDate,
        o.OrderStatus,
        o.PaymentStatus,
        o.PaymentMethod,
        o.SubTotal,
        o.ShippingCost,
        o.TaxAmount,
        o.DiscountAmount,
        o.TotalAmount,
        o.TrackingNumber,
        o.Notes,
        u.UserID AS CustomerID,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
        u.Email AS CustomerEmail,
        u.PhoneNumber AS CustomerPhone,
        a.AddressLine1,
        a.AddressLine2,
        a.City,
        a.State,
        a.ZipCode,
        a.Country,
        oi.OrderItemID,
        oi.ProductID,
        p.ProductName,
        p.SKU,
        oi.Quantity,
        oi.UnitPrice,
        oi.DiscountAmount AS ItemDiscount,
        oi.TotalPrice AS ItemTotal,
        vp.BusinessName AS VendorName,
        vu.Email AS VendorEmail
    FROM Orders o
    INNER JOIN Users u ON o.CustomerID = u.UserID
    INNER JOIN Addresses a ON o.AddressID = a.AddressID
    INNER JOIN OrderItems oi ON o.OrderID = oi.OrderID
    INNER JOIN Products p ON oi.ProductID = p.ProductID
    INNER JOIN Users vu ON oi.VendorID = vu.UserID
    INNER JOIN VendorProfiles vp ON vu.UserID = vp.UserID
    WHERE o.OrderID = @OrderID;
END;
GO

-- SP: Get Sales Report Data
CREATE PROCEDURE sp_GetSalesReportData
    @ReportType NVARCHAR(20) = 'daily'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FromDate DATE;
    DECLARE @ToDate DATE = CAST(GETDATE() AS DATE);

    IF @ReportType = 'daily'
        SET @FromDate = DATEADD(DAY, -30, @ToDate);
    ELSE IF @ReportType = 'weekly'
        SET @FromDate = DATEADD(WEEK, -12, @ToDate);
    ELSE IF @ReportType = 'monthly'
        SET @FromDate = DATEADD(MONTH, -12, @ToDate);
    ELSE
        SET @FromDate = DATEADD(DAY, -30, @ToDate);

    SELECT 
        CASE 
            WHEN @ReportType = 'daily' THEN CAST(o.OrderDate AS DATE)
            WHEN @ReportType = 'weekly' THEN DATEADD(WEEK, DATEDIFF(WEEK, 0, o.OrderDate), 0)
            WHEN @ReportType = 'monthly' THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, o.OrderDate), 0)
        END AS Period,
        COUNT(DISTINCT o.OrderID) AS TotalOrders,
        SUM(o.TotalAmount) AS TotalRevenue,
        SUM(o.SubTotal) AS TotalSubTotal,
        SUM(o.ShippingCost) AS TotalShipping,
        SUM(o.TaxAmount) AS TotalTax,
        SUM(o.DiscountAmount) AS TotalDiscounts,
        AVG(o.TotalAmount) AS AverageOrderValue,
        COUNT(DISTINCT o.CustomerID) AS UniqueCustomers
    FROM Orders o
    WHERE o.OrderStatus NOT IN ('Cancelled', 'Refunded')
      AND CAST(o.OrderDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY 
        CASE 
            WHEN @ReportType = 'daily' THEN CAST(o.OrderDate AS DATE)
            WHEN @ReportType = 'weekly' THEN DATEADD(WEEK, DATEDIFF(WEEK, 0, o.OrderDate), 0)
            WHEN @ReportType = 'monthly' THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, o.OrderDate), 0)
        END
    ORDER BY Period;
END;
GO

-- SP: Get Top Vendors
CREATE PROCEDURE sp_GetTopVendors
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    IF @FromDate IS NULL SET @FromDate = DATEADD(MONTH, -1, CAST(GETDATE() AS DATE));
    IF @ToDate IS NULL SET @ToDate = CAST(GETDATE() AS DATE);

    SELECT TOP (@TopN)
        vp.UserID AS VendorID,
        vp.BusinessName,
        CONCAT(u.FirstName, ' ', u.LastName) AS OwnerName,
        COUNT(DISTINCT oi.OrderID) AS TotalOrders,
        SUM(oi.TotalPrice) AS TotalRevenue,
        COUNT(DISTINCT oi.ProductID) AS ProductsSold
    FROM OrderItems oi
    INNER JOIN Orders o ON oi.OrderID = o.OrderID
    INNER JOIN VendorProfiles vp ON oi.VendorID = vp.UserID
    INNER JOIN Users u ON vp.UserID = u.UserID
    WHERE o.OrderStatus NOT IN ('Cancelled', 'Refunded')
      AND CAST(o.OrderDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY vp.UserID, vp.BusinessName, u.FirstName, u.LastName
    ORDER BY TotalRevenue DESC;
END;
GO

-- SP: Get Best Selling Products
CREATE PROCEDURE sp_GetBestSellingProducts
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @TopN INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    IF @FromDate IS NULL SET @FromDate = DATEADD(MONTH, -1, CAST(GETDATE() AS DATE));
    IF @ToDate IS NULL SET @ToDate = CAST(GETDATE() AS DATE);

    SELECT TOP (@TopN)
        p.ProductID,
        p.ProductName,
        p.SKU,
        c.CategoryName,
        vp.BusinessName AS VendorName,
        SUM(oi.Quantity) AS TotalQuantitySold,
        SUM(oi.TotalPrice) AS TotalRevenue,
        AVG(oi.UnitPrice) AS AveragePrice
    FROM OrderItems oi
    INNER JOIN Orders o ON oi.OrderID = o.OrderID
    INNER JOIN Products p ON oi.ProductID = p.ProductID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN VendorProfiles vp ON p.VendorID = vp.UserID
    WHERE o.OrderStatus NOT IN ('Cancelled', 'Refunded')
      AND CAST(o.OrderDate AS DATE) BETWEEN @FromDate AND @ToDate
    GROUP BY p.ProductID, p.ProductName, p.SKU, c.CategoryName, vp.BusinessName
    ORDER BY TotalQuantitySold DESC;
END;
GO

-- SP: Get Dashboard Stats
CREATE PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        (SELECT COUNT(*) FROM Users WHERE UserType = 'Customer' AND IsActive = 1) AS TotalCustomers,
        (SELECT COUNT(*) FROM Users WHERE UserType = 'Vendor' AND IsActive = 1) AS TotalVendors,
        (SELECT COUNT(*) FROM Products WHERE IsActive = 1) AS TotalProducts,
        (SELECT COUNT(*) FROM Orders WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayOrders,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Orders WHERE OrderStatus NOT IN ('Cancelled', 'Refunded') AND CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayRevenue,
        (SELECT COUNT(*) FROM Orders WHERE OrderStatus = 'Pending') AS PendingOrders,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ApprovalStatus = 'Pending') AS PendingVendors,
        (SELECT COUNT(*) FROM Reviews WHERE IsApproved = 0) AS PendingReviews;
END;
GO

-- =============================================
-- ADDITIONAL TABLES FOR ORDER FLOW COMPLETION
-- =============================================

-- Disputes Table (for customer/vendor dispute management)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Disputes')
BEGIN
    CREATE TABLE Disputes (
        DisputeID INT IDENTITY(1,1) PRIMARY KEY,
        OrderID INT NOT NULL,
        CustomerID INT NULL,
        VendorID INT NULL,
        Reason NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Resolved', 'Cancelled', 'Refunded'
        AdminNotes NVARCHAR(MAX),
        CreatedDate DATETIME DEFAULT GETDATE(),
        ResolvedDate DATETIME NULL,
        CONSTRAINT FK_Disputes_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
        CONSTRAINT FK_Disputes_Customer FOREIGN KEY (CustomerID) REFERENCES Users(UserID),
        CONSTRAINT FK_Disputes_Vendor FOREIGN KEY (VendorID) REFERENCES Users(UserID)
    );
END
GO

-- =============================================
-- STORED PROCEDURES FOR ADMIN ORDER & DISPUTE MANAGEMENT
-- =============================================

-- SP: Get All Orders (Admin View)
CREATE OR ALTER PROCEDURE sp_GetAllOrders
    @Status NVARCHAR(20) = NULL,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SELECT 
        o.OrderID,
        o.CustomerID,
        CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
        o.OrderDate,
        o.OrderStatus,
        o.PaymentStatus,
        o.TotalAmount,
        COUNT(oi.OrderItemID) AS ItemCount,
        CASE WHEN EXISTS (SELECT 1 FROM Disputes d WHERE d.OrderID = o.OrderID AND d.Status = 'Pending') 
             THEN 1 ELSE 0 END AS HasDispute
    FROM Orders o
    INNER JOIN Users u ON o.CustomerID = u.UserID
    LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
    WHERE (@Status IS NULL OR o.OrderStatus = @Status)
      AND (@FromDate IS NULL OR CAST(o.OrderDate AS DATE) >= @FromDate)
      AND (@ToDate IS NULL OR CAST(o.OrderDate AS DATE) <= @ToDate)
    GROUP BY o.OrderID, o.CustomerID, o.OrderDate, o.OrderStatus, o.PaymentStatus, o.TotalAmount, u.FirstName, u.LastName
    ORDER BY o.OrderDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP: Create Dispute
CREATE OR ALTER PROCEDURE sp_CreateDispute
    @OrderID INT,
    @CustomerID INT = NULL,
    @VendorID INT = NULL,
    @Reason NVARCHAR(MAX),
    @Status NVARCHAR(20) = 'Pending'
AS
BEGIN
    INSERT INTO Disputes (OrderID, CustomerID, VendorID, Reason, Status)
    VALUES (@OrderID, @CustomerID, @VendorID, @Reason, @Status);
    SELECT SCOPE_IDENTITY() AS DisputeID;
END;
GO

-- SP: Get All Disputes (Admin)
CREATE OR ALTER PROCEDURE sp_GetAllDisputes
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    SELECT 
        d.DisputeID,
        d.OrderID,
        CONCAT('ORD-', d.OrderID) AS OrderNumber,
        d.CustomerID,
        CONCAT(cu.FirstName, ' ', cu.LastName) AS CustomerName,
        d.VendorID,
        vp.BusinessName AS VendorName,
        d.Reason,
        d.Status,
        d.CreatedDate,
        d.AdminNotes,
        d.ResolvedDate
    FROM Disputes d
    LEFT JOIN Users cu ON d.CustomerID = cu.UserID
    LEFT JOIN VendorProfiles vp ON d.VendorID = vp.UserID
    WHERE (@Status IS NULL OR d.Status = @Status)
    ORDER BY d.CreatedDate DESC;
END;
GO

-- SP: Resolve Dispute
CREATE OR ALTER PROCEDURE sp_ResolveDispute
    @DisputeID INT,
    @AdminNotes NVARCHAR(MAX),
    @Action NVARCHAR(20) -- 'Resolve', 'CancelOrder', 'Refund'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    UPDATE Disputes 
    SET Status = CASE 
                    WHEN @Action IN ('CancelOrder', 'Refund') THEN @Action
                    ELSE 'Resolved'
                 END,
        AdminNotes = @AdminNotes,
        ResolvedDate = GETDATE()
    WHERE DisputeID = @DisputeID;

    -- If action is CancelOrder, update order status
    IF @Action = 'CancelOrder'
    BEGIN
        DECLARE @OrderID INT;
        SELECT @OrderID = OrderID FROM Disputes WHERE DisputeID = @DisputeID;
        UPDATE Orders SET OrderStatus = 'Cancelled', ModifiedDate = GETDATE() WHERE OrderID = @OrderID;
    END

    -- If action is Refund, update order and payment status
    IF @Action = 'Refund'
    BEGIN
        DECLARE @OrderID2 INT;
        SELECT @OrderID2 = OrderID FROM Disputes WHERE DisputeID = @DisputeID;
        UPDATE Orders SET OrderStatus = 'Refunded', PaymentStatus = 'Refunded', ModifiedDate = GETDATE() WHERE OrderID = @OrderID2;
    END

    COMMIT TRANSACTION;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'Order flow and dispute management tables/procedures added successfully.';

-- =============================================
-- END OF SCRIPT
-- =============================================

PRINT 'SellPoint Full Database Created Successfully!';
GO