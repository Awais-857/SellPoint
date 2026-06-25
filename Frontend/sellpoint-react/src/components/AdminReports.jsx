// src/components/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminReports.css';

function AdminReports() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reportType, setReportType] = useState('daily');
    const [reportData, setReportData] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalCustomers: 0,
        totalVendors: 0,
        totalProducts: 0,
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        pendingVendors: 0,
        pendingReviews: 0
    });
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        if (!token) {
            navigate('/login');
            return;
        }
        if (userType !== 'Admin') {
            navigate('/dashboard');
            return;
        }

        fetchReports();
        fetchTopVendors();
        fetchTopProducts();
        fetchDashboardStats();
    }, [reportType, dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/reports/sales', {
                params: {
                    type: reportType,
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate
                }
            });
            setReportData(response.data);
        } catch (err) {
            console.error('Failed to fetch reports', err);
            setError('Failed to load sales reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopVendors = async () => {
        try {
            const response = await api.get('/admin/reports/top-vendors', {
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                    topN: 5
                }
            });
            setTopVendors(response.data);
        } catch (err) {
            console.error('Failed to fetch top vendors', err);
        }
    };

    const fetchTopProducts = async () => {
        try {
            const response = await api.get('/admin/reports/top-products', {
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                    topN: 5
                }
            });
            setTopProducts(response.data);
        } catch (err) {
            console.error('Failed to fetch top products', err);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            setDashboardStats(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
        }
    };

    const handleExportCSV = () => {
        if (!reportData.length) {
            alert('No data to export');
            return;
        }

        const headers = ['Period', 'Total Orders', 'Total Revenue', 'Subtotal', 'Shipping', 'Tax', 'Avg Order Value'];
        const csvRows = [headers];

        reportData.forEach(row => {
            csvRows.push([
                row.period,
                row.totalOrders,
                row.totalRevenue,
                row.totalSubTotal,
                row.totalShipping,
                row.totalTax,
                row.averageOrderValue
            ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handlePrintReport = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getMaxRevenue = () => {
        if (!reportData.length) return 0;
        return Math.max(...reportData.map(r => r.totalRevenue));
    };

    const getBarHeight = (revenue) => {
        const maxRevenue = getMaxRevenue();
        if (maxRevenue === 0) return '0%';
        return `${(revenue / maxRevenue) * 100}%`;
    };

    if (loading && reportData.length === 0) {
        return (
            <div className="admin-reports-container">
                <div className="admin-reports-header">
                    <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                        <span onClick={() => navigate('/admin/categories')}>Categories</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-reports-container">
            {/* Header */}
            <div className="admin-reports-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className="admin-reports-main">
                <div className="page-header">
                    <h2>Sales Reports & Analytics</h2>
                    <div className="report-actions">
                        <button onClick={handleExportCSV} className="export-btn">📊 Export CSV</button>
                        <button onClick={handlePrintReport} className="print-btn">🖨️ Print Report</button>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchReports}>Retry</button>
                    </div>
                )}

                {/* Dashboard Stats Cards */}
                <div className="dashboard-stats-grid">
                    <div className="stats-card">
                        <div className="stats-icon">👥</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.totalCustomers}</span>
                            <span className="stats-label">Total Customers</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">🏪</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.totalVendors}</span>
                            <span className="stats-label">Total Vendors</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">📦</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.totalProducts}</span>
                            <span className="stats-label">Total Products</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">💰</div>
                        <div className="stats-info">
                            <span className="stats-value">{formatCurrency(dashboardStats.todayRevenue)}</span>
                            <span className="stats-label">Today's Revenue</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">📋</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.todayOrders}</span>
                            <span className="stats-label">Today's Orders</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">⏳</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.pendingOrders}</span>
                            <span className="stats-label">Pending Orders</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">👥</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.pendingVendors}</span>
                            <span className="stats-label">Pending Vendors</span>
                        </div>
                    </div>
                    <div className="stats-card">
                        <div className="stats-icon">⭐</div>
                        <div className="stats-info">
                            <span className="stats-value">{dashboardStats.pendingReviews}</span>
                            <span className="stats-label">Pending Reviews</span>
                        </div>
                    </div>
                </div>

                {/* Report Filters */}
                <div className="report-filters">
                    <div className="filter-group">
                        <label>Report Type</label>
                        <div className="type-buttons">
                            <button
                                className={`type-btn ${reportType === 'daily' ? 'active' : ''}`}
                                onClick={() => setReportType('daily')}
                            >
                                Daily (Last 30 Days)
                            </button>
                            <button
                                className={`type-btn ${reportType === 'weekly' ? 'active' : ''}`}
                                onClick={() => setReportType('weekly')}
                            >
                                Weekly (Last 12 Weeks)
                            </button>
                            <button
                                className={`type-btn ${reportType === 'monthly' ? 'active' : ''}`}
                                onClick={() => setReportType('monthly')}
                            >
                                Monthly (Last 12 Months)
                            </button>
                        </div>
                    </div>

                    <div className="filter-group date-range">
                        <label>Custom Date Range</label>
                        <div className="date-inputs">
                            <input
                                type="date"
                                value={dateRange.fromDate}
                                onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={dateRange.toDate}
                                onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Sales Chart */}
                <div className="chart-card">
                    <h3>Sales Overview</h3>
                    {reportData.length === 0 ? (
                        <div className="no-data">
                            <p>No sales data available for the selected period.</p>
                        </div>
                    ) : (
                        <div className="chart-container">
                            <div className="chart-bars">
                                {reportData.map((item, index) => (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div className="chart-bar" style={{ height: getBarHeight(item.totalRevenue) }}>
                                            <span className="bar-value">{formatCurrency(item.totalRevenue)}</span>
                                        </div>
                                        <div className="bar-label">{item.period}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sales Data Table */}
                <div className="data-table-card">
                    <h3>Sales Data</h3>
                    <div className="table-container">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                    <th>Subtotal</th>
                                    <th>Shipping</th>
                                    <th>Tax</th>
                                    <th>Avg Order Value</th>
                                    <th>Unique Customers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="period-cell">{row.period}</td>
                                        <td>{row.totalOrders}</td>
                                        <td className="revenue-cell">{formatCurrency(row.totalRevenue)}</td>
                                        <td>{formatCurrency(row.totalSubTotal)}</td>
                                        <td>{formatCurrency(row.totalShipping)}</td>
                                        <td>{formatCurrency(row.totalTax)}</td>
                                        <td>{formatCurrency(row.averageOrderValue)}</td>
                                        <td>{row.uniqueCustomers}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="total-row">
                                    <td><strong>Total</strong></td>
                                    <td><strong>{reportData.reduce((sum, r) => sum + r.totalOrders, 0)}</strong></td>
                                    <td><strong>{formatCurrency(reportData.reduce((sum, r) => sum + r.totalRevenue, 0))}</strong></td>
                                    <td><strong>{formatCurrency(reportData.reduce((sum, r) => sum + r.totalSubTotal, 0))}</strong></td>
                                    <td><strong>{formatCurrency(reportData.reduce((sum, r) => sum + r.totalShipping, 0))}</strong></td>
                                    <td><strong>{formatCurrency(reportData.reduce((sum, r) => sum + r.totalTax, 0))}</strong></td>
                                    <td><strong>{formatCurrency(reportData.reduce((sum, r) => sum + r.averageOrderValue, 0) / reportData.length)}</strong></td>
                                    <td><strong>{reportData.reduce((sum, r) => sum + r.uniqueCustomers, 0)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Two Column Layout for Top Vendors & Products */}
                <div className="two-column-grid">
                    {/* Top Vendors */}
                    <div className="top-card">
                        <h3>🏆 Top Performing Vendors</h3>
                        {topVendors.length === 0 ? (
                            <div className="no-data-small">
                                <p>No vendor data available</p>
                            </div>
                        ) : (
                            <div className="top-list">
                                {topVendors.map((vendor, index) => (
                                    <div key={index} className="top-item">
                                        <div className="top-rank">#{index + 1}</div>
                                        <div className="top-info">
                                            <div className="top-name">{vendor.businessName}</div>
                                            <div className="top-meta">{vendor.totalOrders} orders</div>
                                        </div>
                                        <div className="top-revenue">{formatCurrency(vendor.totalRevenue)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="top-card">
                        <h3>⭐ Best Selling Products</h3>
                        {topProducts.length === 0 ? (
                            <div className="no-data-small">
                                <p>No product data available</p>
                            </div>
                        ) : (
                            <div className="top-list">
                                {topProducts.map((product, index) => (
                                    <div key={index} className="top-item">
                                        <div className="top-rank">#{index + 1}</div>
                                        <div className="top-info">
                                            <div className="top-name">{product.productName}</div>
                                            <div className="top-meta">{product.totalQuantitySold} units sold</div>
                                        </div>
                                        <div className="top-revenue">{formatCurrency(product.totalRevenue)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Insights */}
                <div className="insights-card">
                    <h3>📈 Key Insights</h3>
                    <div className="insights-grid">
                        <div className="insight-item">
                            <span className="insight-icon">📊</span>
                            <div>
                                <strong>Total Revenue</strong>
                                <p>{formatCurrency(reportData.reduce((sum, r) => sum + r.totalRevenue, 0))}</p>
                            </div>
                        </div>
                        <div className="insight-item">
                            <span className="insight-icon">📦</span>
                            <div>
                                <strong>Total Orders</strong>
                                <p>{reportData.reduce((sum, r) => sum + r.totalOrders, 0)}</p>
                            </div>
                        </div>
                        <div className="insight-item">
                            <span className="insight-icon">⭐</span>
                            <div>
                                <strong>Best Day</strong>
                                <p>
                                    {reportData.length > 0 ?
                                        reportData.reduce((max, r) => r.totalRevenue > max.totalRevenue ? r : max, reportData[0]).period :
                                        'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="insight-item">
                            <span className="insight-icon">💰</span>
                            <div>
                                <strong>Avg Order Value</strong>
                                <p>{formatCurrency(reportData.reduce((sum, r) => sum + r.averageOrderValue, 0) / (reportData.length || 1))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminReports;