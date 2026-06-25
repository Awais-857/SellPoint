================================================================================
SELLPOINT – Multi‑Vendor Marketplace
================================================================================

A full‑stack e‑commerce platform where multiple vendors can register, list products,
and manage orders. Customers can browse, purchase, and track orders – all in one
marketplace.

Live Demo: [URL]

================================================================================
FEATURES
================================================================================

- **Multi-Vendor System**
  Vendors register, upload documents, and get admin approval.

- **Customer Dashboard**
  Order history, order tracking, reviews.

- **Shopping Cart**
  Multi-vendor checkout with address management.

- **Vendor Dashboard**
  Product management, order fulfillment, revenue analytics.

- **Admin Panel**
  Vendor approval, category management, sales reports (CSV), dispute resolution.

- **Review System**
  Customers review delivered products; admin approves them.

================================================================================
TECH STACK
================================================================================

### Frontend
  - React 19
  - React Router 7
  - Axios
  - CSS (custom)

### Backend
  - ASP.NET Core 10
  - JWT Authentication
  - SQL Server
  - BCrypt for password hashing

### Database
  - Microsoft SQL Server
  - Stored Procedures for all data operations

================================================================================
LOCAL SETUP
================================================================================

### Prerequisites:
  - Node.js 18+
  - .NET 10 SDK
  - SQL Server (or SQL Express)

### Database:
  1. Run the script `database/SellPoint_Full_Database.sql` in SQL Server Management Studio.
  2. Update `appsettings.json` with your connection string.

### Backend:
```bash
cd backend/SellPoint.API
dotnet restore
dotnet run
```
API runs on `https://localhost:7215` and `http://localhost:5274`.

### Frontend:
```bash
cd frontend/sellpoint-react
npm install
npm start
```
App runs on `http://localhost:3000`.

### Environment Variables:
  Copy `.env.example` to `.env` and update `REACT_APP_API_URL` if needed.

================================================================================
ENVIRONMENT VARIABLES
================================================================================

### Backend (`appsettings.json` or environment variables):
  - `ConnectionStrings__DefaultConnection` : SQL Server connection string
  - `Jwt__Key` : JWT signing key (change in production)

### Frontend (`.env`):
  - `REACT_APP_API_URL` : Backend API URL (e.g., `http://localhost:5274/api`)

================================================================================
DEPLOYMENT
================================================================================

- **Frontend:** Vercel / Netlify (static)
- **Backend:** Render / Azure App Service (with environment variables)
- **Database:** Azure SQL / Supabase (PostgreSQL compatible)

================================================================================
LICENSE
================================================================================

This project was created for academic and portfolio purposes. No commercial license.

================================================================================
CONTACT
================================================================================

[Awais Iqbal] – [www.linkedin.com/in/awais-iqbal-hi]