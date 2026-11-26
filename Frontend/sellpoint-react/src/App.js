// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ServerWakeUpBanner from './components/ServerWakeUpBanner';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ProductListing from './components/ProductListing';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import OrderHistory from './components/OrderHistory';
import OrderDetail from './components/OrderDetail';
import VendorProducts from './components/VendorProducts';
import VendorOrders from './components/VendorOrders';
import VendorRevenue from './components/VendorRevenue';
import AdminVendors from './components/AdminVendors';
import AdminCategories from './components/AdminCategories';
import AdminReports from './components/AdminReports';
import AdminOrders from './components/AdminOrders';
import AdminDisputes from './components/AdminDisputes';
import ReviewForm from './components/ReviewForm';
import AdminReviews from './components/AdminReviews';
import OrderTracking from './components/OrderTracking';
import './App.css';
import { IS_DEMO_MODE } from './config/appConfig';
import { DemoProvider, useDemo } from './demo/DemoProvider';
import { DemoNotificationCenter } from './demo/DemoNotificationCenter';
import { DemoPortal, DemoWorkspace } from './demo/DemoPortal';
import { DemoWishlistPage } from './demo/DemoWishlistPages';
import { DemoCustomerProfilePage, DemoCustomerAddressesPage } from './demo/DemoCustomerAccountPages';
import { DemoCustomerReviewsPage, DemoReviewForm, DemoVendorReviewsPage } from './demo/DemoReviewPages';
import { DemoCustomerReturns, DemoVendorReturns, DemoAdminReturns } from './demo/DemoReturnPages';
import { DemoPublicStoresPage, DemoPublicStorePage, DemoVendorStoreProfile } from './demo/DemoStorePages';
import { DemoCheckout, DemoOrderConfirmation, DemoOrderHistory, DemoOrderDetail, DemoOrderTracking } from './demo/DemoCustomerPages';
import { DemoVendorDashboard, DemoVendorProducts, DemoVendorOrders, DemoVendorRevenue } from './demo/DemoVendorPages';
import { DemoAdminDashboard, DemoAdminVendors, DemoAdminProducts, DemoAdminCategories, DemoAdminOrders, DemoAdminDisputes, DemoAdminReviews, DemoAdminReports } from './demo/DemoAdminPages';

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (token) {
    // Redirect to appropriate dashboard if already logged in
    switch (userType) {
      case 'Admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'Vendor':
        return <Navigate to="/vendor-dashboard" replace />;
      default:
        return <Navigate to="/customer-dashboard" replace />;
    }
  }

  return children;
}

function DemoCustomerRoute({ children }) {
  const { session } = useDemo();

  if (!session) return <Navigate to="/demo" replace />;
  if (session.role !== 'Customer') return <Navigate to="/demo/workspace" replace />;

  return children;
}

function DemoSessionRoute({ children }) {
  const { session } = useDemo();
  if (!session) return <Navigate to="/demo" replace />;
  return children;
}

function DemoVendorRoute({ children }) {
  const { session } = useDemo();

  if (!session) return <Navigate to="/demo" replace />;
  if (session.role !== 'Vendor') return <Navigate to="/demo/workspace" replace />;

  return children;
}

function DemoAdminRoute({ children }) {
  const { session } = useDemo();

  if (!session) return <Navigate to="/demo" replace />;
  if (session.role !== 'Admin') return <Navigate to="/demo/workspace" replace />;

  return children;
}

function App() {
  if (IS_DEMO_MODE) {
    return (
      <BrowserRouter>
        <DemoProvider>
          <div className="App">
            <Routes>
              <Route path="/demo" element={<DemoPortal />} />
              <Route path="/demo/workspace" element={<DemoWorkspace />} />
              <Route path="/products" element={<DemoCustomerRoute><ProductListing /></DemoCustomerRoute>} />
              <Route path="/stores" element={<DemoSessionRoute><DemoPublicStoresPage /></DemoSessionRoute>} />
              <Route path="/store/:vendorId" element={<DemoSessionRoute><DemoPublicStorePage /></DemoSessionRoute>} />
              <Route path="/product/:id" element={<DemoSessionRoute><ProductDetail /></DemoSessionRoute>} />
              <Route path="/cart" element={<DemoCustomerRoute><Cart /></DemoCustomerRoute>} />
              <Route path="/wishlist" element={<DemoCustomerRoute><DemoWishlistPage /></DemoCustomerRoute>} />
              <Route path="/customer/profile" element={<DemoCustomerRoute><DemoCustomerProfilePage /></DemoCustomerRoute>} />
              <Route path="/customer/addresses" element={<DemoCustomerRoute><DemoCustomerAddressesPage /></DemoCustomerRoute>} />
              <Route path="/customer/reviews" element={<DemoCustomerRoute><DemoCustomerReviewsPage /></DemoCustomerRoute>} />
              <Route path="/customer/returns" element={<DemoCustomerRoute><DemoCustomerReturns /></DemoCustomerRoute>} />
              <Route path="/product/:id/review" element={<DemoCustomerRoute><DemoReviewForm /></DemoCustomerRoute>} />
              <Route path="/checkout" element={<DemoCustomerRoute><DemoCheckout /></DemoCustomerRoute>} />
              <Route path="/order-confirmation/:id" element={<DemoCustomerRoute><DemoOrderConfirmation /></DemoCustomerRoute>} />
              <Route path="/order-history" element={<DemoCustomerRoute><DemoOrderHistory /></DemoCustomerRoute>} />
              <Route path="/order-detail/:id" element={<DemoCustomerRoute><DemoOrderDetail /></DemoCustomerRoute>} />
              <Route path="/order-tracking/:id" element={<DemoCustomerRoute><DemoOrderTracking /></DemoCustomerRoute>} />
              <Route path="/vendor-dashboard" element={<DemoVendorRoute><DemoVendorDashboard /></DemoVendorRoute>} />
              <Route path="/vendor/products" element={<DemoVendorRoute><DemoVendorProducts /></DemoVendorRoute>} />
              <Route path="/vendor/store-profile" element={<DemoVendorRoute><DemoVendorStoreProfile /></DemoVendorRoute>} />
              <Route path="/vendor/orders" element={<DemoVendorRoute><DemoVendorOrders /></DemoVendorRoute>} />
              <Route path="/vendor/reviews" element={<DemoVendorRoute><DemoVendorReviewsPage /></DemoVendorRoute>} />
              <Route path="/vendor/returns" element={<DemoVendorRoute><DemoVendorReturns /></DemoVendorRoute>} />
              <Route path="/vendor/revenue" element={<DemoVendorRoute><DemoVendorRevenue /></DemoVendorRoute>} />
              <Route path="/admin-dashboard" element={<DemoAdminRoute><DemoAdminDashboard /></DemoAdminRoute>} />
              <Route path="/admin/vendors" element={<DemoAdminRoute><DemoAdminVendors /></DemoAdminRoute>} />
              <Route path="/admin/products" element={<DemoAdminRoute><DemoAdminProducts /></DemoAdminRoute>} />
              <Route path="/admin/categories" element={<DemoAdminRoute><DemoAdminCategories /></DemoAdminRoute>} />
              <Route path="/admin/orders" element={<DemoAdminRoute><DemoAdminOrders /></DemoAdminRoute>} />
              <Route path="/admin/disputes" element={<DemoAdminRoute><DemoAdminDisputes /></DemoAdminRoute>} />
              <Route path="/admin/reviews" element={<DemoAdminRoute><DemoAdminReviews /></DemoAdminRoute>} />
              <Route path="/admin/returns" element={<DemoAdminRoute><DemoAdminReturns /></DemoAdminRoute>} />
              <Route path="/admin/reports" element={<DemoAdminRoute><DemoAdminReports /></DemoAdminRoute>} />
              <Route path="/" element={<Navigate to="/demo" replace />} />
              <Route path="*" element={<Navigate to="/demo" replace />} />
            </Routes>
            <DemoNotificationCenter />
          </div>
        </DemoProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <ServerWakeUpBanner />
        <Routes>
          {/* Public Routes - No login required, redirect if already logged in */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/admin/reviews" element={
          <ProtectedRoute>
              <AdminReviews />
          </ProtectedRoute>
          } />
          <Route path="/order-tracking/:id" element={
              <ProtectedRoute>
                  <OrderTracking />
              </ProtectedRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />

          {/* Public Product Browsing - No login required */}
          <Route path="/products" element={<ProductListing />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Protected Routes - Login required */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/order-confirmation/:id" element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          } />
          <Route path="/order-history" element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          } />
          <Route path="/product/:id/review" element={
              <ProtectedRoute>
                  <ReviewForm />
              </ProtectedRoute>
          } />
          <Route path="/order-detail/:id" element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } />

          {/* Vendor Routes */}
          <Route path="/vendor/products" element={
            <ProtectedRoute>
              <VendorProducts />
            </ProtectedRoute>
          } />
          <Route path="/vendor/orders" element={
            <ProtectedRoute>
              <VendorOrders />
            </ProtectedRoute>
          } />
          <Route path="/vendor/revenue" element={
            <ProtectedRoute>
              <VendorRevenue />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/vendors" element={
            <ProtectedRoute>
              <AdminVendors />
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <AdminCategories />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/disputes" element={
            <ProtectedRoute>
              <AdminDisputes />
            </ProtectedRoute>
          } />

          {/* Dashboard Redirector */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendor-dashboard" element={
            <ProtectedRoute>
              <VendorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard" element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;