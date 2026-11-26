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
import { DemoPortal, DemoWorkspace } from './demo/DemoPortal';
import { DemoCheckout, DemoOrderConfirmation, DemoOrderHistory, DemoOrderDetail, DemoOrderTracking } from './demo/DemoCustomerPages';

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
              <Route path="/product/:id" element={<DemoCustomerRoute><ProductDetail /></DemoCustomerRoute>} />
              <Route path="/cart" element={<DemoCustomerRoute><Cart /></DemoCustomerRoute>} />
              <Route path="/checkout" element={<DemoCustomerRoute><DemoCheckout /></DemoCustomerRoute>} />
              <Route path="/order-confirmation/:id" element={<DemoCustomerRoute><DemoOrderConfirmation /></DemoCustomerRoute>} />
              <Route path="/order-history" element={<DemoCustomerRoute><DemoOrderHistory /></DemoCustomerRoute>} />
              <Route path="/order-detail/:id" element={<DemoCustomerRoute><DemoOrderDetail /></DemoCustomerRoute>} />
              <Route path="/order-tracking/:id" element={<DemoCustomerRoute><DemoOrderTracking /></DemoCustomerRoute>} />
              <Route path="/" element={<Navigate to="/demo" replace />} />
              <Route path="*" element={<Navigate to="/demo" replace />} />
            </Routes>
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