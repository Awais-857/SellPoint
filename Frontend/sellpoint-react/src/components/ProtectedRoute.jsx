// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    // Not logged in
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Check role if specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
        // Redirect to appropriate dashboard based on role
        if (userType === 'Admin') return <Navigate to="/admin-dashboard" replace />;
        if (userType === 'Vendor') return <Navigate to="/vendor-dashboard" replace />;
        return <Navigate to="/customer-dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;