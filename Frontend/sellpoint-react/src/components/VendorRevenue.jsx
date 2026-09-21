// src/components/VendorRevenue.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './VendorRevenue.module.css';

function VendorRevenue() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revenueData, setRevenueData] = useState({
        totalSales: 0,
        monthlySales: 0,
        pendingPayments: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // 'monthly', 'yearly'

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        if (!token) {
            navigate('/login');
            return;
        }
        if (userType !== 'Vendor') {
            navigate('/dashboard');
            return;
        }

        fetchRevenueData();
    }, [selectedPeriod]);

    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            // Fetch revenue summary
            const summaryResponse = await api.get('/vendor/revenue/summary');
            setRevenueData(summaryResponse.data);

            // Fetch recent transactions
            const transactionsResponse = await api.get('/vendor/revenue/transactions', {
                params: { limit: 10 }
            });
            setRecentTransactions(transactionsResponse.data);

            // Fetch monthly/yearly revenue
            const revenueResponse = await api.get('/vendor/revenue/chart', {
                params: { period: selectedPeriod }
            });
            setMonthlyRevenue(revenueResponse.data);
        } catch (err) {
            console.error('Failed to fetch revenue data', err);
            setError('Failed to load revenue data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getMaxRevenue = () => {
        if (!monthlyRevenue.length) return 0;
        return Math.max(...monthlyRevenue.map(m => m.totalRevenue));
    };

    const getBarHeight = (revenue) => {
        const maxRevenue = getMaxRevenue();
        if (maxRevenue === 0) return '0%';
        return `${(revenue / maxRevenue) * 100}%`;
    };

    if (loading) {
        return (
            <div className={styles['vendor-revenue-container']}>
                <div className={styles['vendor-revenue-header']}>
                    <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                    <div className={styles['header-links']}>
                        <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/vendor/products')}>Products</span>
                        <span onClick={() => navigate('/vendor/orders')}>Orders</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className={styles['loading-state']}>
                    <div className={styles['spinner']}></div>
                    <p>Loading revenue data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['vendor-revenue-container']}>
            {/* Header */}
            <div className={styles['vendor-revenue-header']}>
                <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                <div className={styles['header-links']}>
                    <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/vendor/products')}>Products</span>
                    <span onClick={() => navigate('/vendor/orders')}>Orders</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className={styles['vendor-revenue-main']}>
                <div className={styles['page-header']}>
                    <h2>Revenue Dashboard</h2>
                    <div className={styles['period-selector']}>
                        <button
                            className={styles['period-btn'] + (selectedPeriod === 'monthly' ? ' ' + styles['active'] : '')}
                            onClick={() => setSelectedPeriod('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={styles['period-btn'] + (selectedPeriod === 'yearly' ? ' ' + styles['active'] : '')}
                            onClick={() => setSelectedPeriod('yearly')}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                {error && (
                    <div className={styles['error-message']}>
                        <p>{error}</p>
                        <button onClick={fetchRevenueData}>Retry</button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className={styles['stats-grid']}>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>💰</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>Total Sales (All Time)</span>
                            <span className={styles['stat-value']}>{formatCurrency(revenueData.totalSales)}</span>
                        </div>
                    </div>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>📅</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>This Month</span>
                            <span className={styles['stat-value']}>{formatCurrency(revenueData.monthlySales)}</span>
                        </div>
                    </div>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>⏳</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>Pending Payments</span>
                            <span className={styles['stat-value'] + ' ' + styles['pending']}>{formatCurrency(revenueData.pendingPayments)}</span>
                        </div>
                    </div>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>📦</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>Total Orders</span>
                            <span className={styles['stat-value']}>{revenueData.totalOrders}</span>
                        </div>
                    </div>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>⭐</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>Average Order Value</span>
                            <span className={styles['stat-value']}>{formatCurrency(revenueData.averageOrderValue)}</span>
                        </div>
                    </div>
                    <div className={styles['stat-card']}>
                        <div className={styles['stat-icon']}>🚚</div>
                        <div className={styles['stat-info']}>
                            <span className={styles['stat-label']}>Pending / Shipped</span>
                            <span className={styles['stat-value']}>{revenueData.pendingOrders} / {revenueData.shippedOrders}</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className={styles['chart-card']}>
                    <h3>Revenue Overview ({selectedPeriod === 'monthly' ? 'Last 6 Months' : 'Last 5 Years'})</h3>
                    {monthlyRevenue.length === 0 ? (
                        <div className={styles['no-chart-data']}>
                            <p>No revenue data available for the selected period.</p>
                        </div>
                    ) : (
                        <div className={styles['chart-container']}>
                            <div className={styles['chart-bars']}>
                                {monthlyRevenue.map((item, index) => (
                                    <div key={index} className={styles['chart-bar-wrapper']}>
                                        <div className={styles['chart-bar']} style={{ height: getBarHeight(item.totalRevenue) }}>
                                            <span className={styles['bar-value']}>{formatCurrency(item.totalRevenue)}</span>
                                        </div>
                                        <div className={styles['bar-label']}>{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className={styles['transactions-card']}>
                    <h3>Recent Transactions</h3>
                    {recentTransactions.length === 0 ? (
                        <div className={styles['no-transactions']}>
                            <p>No transactions yet.</p>
                        </div>
                    ) : (
                        <div className={styles['transactions-table-container']}>
                            <table className={styles['transactions-table']}>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.map(transaction => (
                                        <tr key={transaction.orderId}>
                                            <td>#{transaction.orderId}</td>
                                            <td>{transaction.customerName}</td>
                                            <td>{formatDate(transaction.orderDate)}</td>
                                            <td className={styles['amount-cell']}>{formatCurrency(transaction.totalAmount)}</td>
                                            <td>
                                                <span className={`${styles['order-status']} ${styles[transaction.orderStatus?.toLowerCase()]}`}>
                                                    {transaction.orderStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles['payment-status']} ${styles[transaction.paymentStatus?.toLowerCase()]}`}>
                                                    {transaction.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className={styles['quick-actions']}>
                    <h3>Quick Actions</h3>
                    <div className={styles['action-buttons']}>
                        <button onClick={() => navigate('/vendor/orders')} className={styles['action-btn']}>
                            View All Orders
                        </button>
                        <button onClick={() => navigate('/vendor/products')} className={styles['action-btn']}>
                            Manage Products
                        </button>
                        <button onClick={() => window.print()} className={styles['action-btn']}>
                            Print Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VendorRevenue;