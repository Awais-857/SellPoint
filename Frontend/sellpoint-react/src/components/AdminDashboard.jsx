// src/components/AdminDashboard.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const userType = localStorage.getItem('userType');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (userType !== 'Admin') {
            navigate('/dashboard');
            return;
        }

        setLoading(false);
    }, [navigate, userType]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <nav className="dashboard-nav">
                    <h1>SellPoint Admin</h1>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </nav>
                <div className="dashboard-content">
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <h1>SellPoint Admin</h1>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </nav>

            <div className="dashboard-content">
                <h2>Admin Dashboard</h2>
                <p>Welcome back, {username}!</p>

                {/* Admin Controls */}
                <div className="dashboard-card">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                        <div
                            style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }}
                            onClick={() => navigate('/admin/vendors')}
                        >
                            <strong>👥 Vendor Management</strong>
                            <p style={{ fontSize: '14px', marginTop: '5px' }}>Approve or reject vendors</p>
                        </div>
                        <div
                            style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }}
                            onClick={() => navigate('/admin/categories')}
                        >
                            <strong>📁 Categories</strong>
                            <p style={{ fontSize: '14px', marginTop: '5px' }}>Manage product categories</p>
                        </div>
                        <div style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }} onClick={() => navigate('/admin/orders')}>
                            <strong>📦 All Orders</strong><p>Monitor all orders</p>
                        </div>
                        <div style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }} onClick={() => navigate('/admin/disputes')}>
                            <strong>⚖️ Disputes</strong><p>Resolve customer/vendor disputes</p>
                        </div>
                        <div style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }} onClick={() => navigate('/admin/reviews')}>
                            <strong>⭐ Pending Reviews</strong>
                            <p style={{ fontSize: '14px', marginTop: '5px' }}>Approve customer reviews</p>
                        </div>
                        <div
                            style={{ padding: '15px', background: '#f7fafc', borderRadius: '5px', cursor: 'pointer' }}
                            onClick={() => navigate('/admin/reports')}
                        >
                            <strong>📊 Sales Reports</strong>
                            <p style={{ fontSize: '14px', marginTop: '5px' }}>View analytics and reports</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;