// src/components/CustomerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

function CustomerDashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('userEmail');
    const userType = localStorage.getItem('userType');
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalSpent: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        if (userType !== 'Customer') {
            if (userType === 'Admin') navigate('/admin-dashboard');
            else if (userType === 'Vendor') navigate('/vendor-dashboard');
            else navigate('/dashboard');
            return;
        }

        fetchCustomerData();
    }, []);

    const fetchCustomerData = async () => {
        setLoading(true);
        try {
            // Fetch orders to calculate stats
            const ordersResponse = await api.get('/orders');
            const orders = ordersResponse.data || [];

            // Calculate statistics
            const delivered = orders.filter(o => o.orderStatus === 'Delivered');
            const pending = orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed');
            const totalSpent = delivered.reduce((sum, o) => sum + o.totalAmount, 0);

            setStats({
                totalOrders: orders.length,
                pendingOrders: pending.length,
                deliveredOrders: delivered.length,
                totalSpent: totalSpent
            });

            // Get recent orders (last 5)
            setRecentOrders(orders.slice(0, 5));
        } catch (err) {
            console.error('Failed to fetch customer data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <nav className="dashboard-nav">
                    <h1>SellPoint</h1>
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
                <h1>SellPoint</h1>
                <div className="nav-links">
                    <span onClick={() => navigate('/products')} style={{ marginRight: '15px', cursor: 'pointer' }}>Shop</span>
                    <span onClick={() => navigate('/cart')} style={{ marginRight: '15px', cursor: 'pointer' }}>Cart 🛒</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <h2>Welcome back, {username}!</h2>
                <p>{email}</p>

                {/* Statistics Cards */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', marginTop: '20px' }}>
                    <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '32px', color: '#667eea', margin: '0' }}>{stats.totalOrders}</h3>
                        <p style={{ color: '#718096', margin: '5px 0 0' }}>Total Orders</p>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '32px', color: '#ed8936', margin: '0' }}>{stats.pendingOrders}</h3>
                        <p style={{ color: '#718096', margin: '5px 0 0' }}>Pending Orders</p>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '32px', color: '#48bb78', margin: '0' }}>{stats.deliveredOrders}</h3>
                        <p style={{ color: '#718096', margin: '5px 0 0' }}>Delivered Orders</p>
                    </div>
                    <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '32px', color: '#667eea', margin: '0' }}>${stats.totalSpent.toFixed(2)}</h3>
                        <p style={{ color: '#718096', margin: '5px 0 0' }}>Total Spent</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card" style={{ marginBottom: '25px' }}>
                    <h3>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        <button
                            onClick={() => navigate('/products')}
                            style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            🛍️ Continue Shopping
                        </button>
                        <button
                            onClick={() => navigate('/cart')}
                            style={{ padding: '12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            🛒 View Cart
                        </button>
                        <button
                            onClick={() => navigate('/order-history')}
                            style={{ padding: '12px', background: '#4299e1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            📦 Order History
                        </button>
                    </div>
                </div>

                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                    <div className="dashboard-card">
                        <h3>Recent Orders</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Order #</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Total</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order.orderId} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '10px' }}>#{order.orderId}</td>
                                            <td style={{ padding: '10px' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span className={`status-badge ${order.orderStatus?.toLowerCase()}`}>
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>${order.totalAmount?.toFixed(2)}</td>
                                            <td style={{ padding: '10px' }}>
                                                <button
                                                    onClick={() => navigate(`/order-detail/${order.orderId}`)}
                                                    style={{ padding: '5px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {recentOrders.length === 5 && (
                            <button
                                onClick={() => navigate('/order-history')}
                                style={{ marginTop: '15px', padding: '8px 16px', background: 'transparent', color: '#667eea', border: '1px solid #667eea', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                View All Orders →
                            </button>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {recentOrders.length === 0 && (
                    <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '60px', marginBottom: '15px' }}>🛒</div>
                        <h3>No Orders Yet</h3>
                        <p>Start shopping to see your orders here!</p>
                        <button
                            onClick={() => navigate('/products')}
                            style={{ marginTop: '15px', padding: '10px 25px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Start Shopping
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-badge.delivered {
                    background: #c6f6d5;
                    color: #22543d;
                }
                .status-badge.shipped {
                    background: #bee3f8;
                    color: #2c5282;
                }
                .status-badge.pending {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-badge.confirmed {
                    background: #fed7e2;
                    color: #97266d;
                }
                .status-badge.cancelled {
                    background: #fed7d7;
                    color: #c53030;
                }
            `}</style>
        </div>
    );
}

export default CustomerDashboard;