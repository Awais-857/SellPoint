// src/components/Dashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const userType = localStorage.getItem('userType');
    const token = localStorage.getItem('token');

    useEffect(() => {
        // If no token, redirect to login
        if (!token) {
            navigate('/login');
            return;
        }

        // Redirect based on user type
        switch (userType) {
            case 'Admin':
                navigate('/admin-dashboard');
                break;
            case 'Vendor':
                navigate('/vendor-dashboard');
                break;
            case 'Customer':
                navigate('/customer-dashboard');
                break;
            default:
                localStorage.clear();
                navigate('/login');
        }
    }, [navigate, userType, token]);

    // Show loading while redirecting
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <p>Loading...</p>
        </div>
    );
}

export default Dashboard;