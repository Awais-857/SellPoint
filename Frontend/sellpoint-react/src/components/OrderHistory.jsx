// src/components/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './OrderHistory.css';

function OrderHistory() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
            setError('Failed to load order history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = (orderId) => {
        navigate(`/order-detail/${orderId}`);
    };

    const handleTrackOrder = (orderId) => {
        navigate(`/order-tracking/${orderId}`);
    };

    const handleReorder = async (orderId) => {
        try {
            const response = await api.post(`/orders/${orderId}/reorder`);
            if (response.data.success) {
                navigate('/cart');
            }
        } catch (err) {
            console.error('Failed to reorder', err);
            alert('Failed to add items to cart. Please try again.');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            await api.put(`/orders/${orderId}/cancel`);
            fetchOrders(); // Refresh orders
            alert('Order cancelled successfully');
        } catch (err) {
            console.error('Failed to cancel order', err);
            alert('Failed to cancel order. Please try again.');
        }
    };

    const getFilteredOrders = () => {
        if (filterStatus === 'all') {
            return orders;
        }
        return orders.filter(order => order.orderStatus.toLowerCase() === filterStatus);
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'badge-delivered';
            case 'shipped':
                return 'badge-shipped';
            case 'confirmed':
                return 'badge-confirmed';
            case 'pending':
                return 'badge-pending';
            case 'cancelled':
                return 'badge-cancelled';
            default:
                return 'badge-default';
        }
    };

    const getPaymentBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'payment-paid';
            case 'pending':
                return 'payment-pending';
            case 'failed':
                return 'payment-failed';
            case 'refunded':
                return 'payment-refunded';
            default:
                return 'payment-default';
        }
    };

    if (loading) {
        return (
            <div className="order-history-container">
                <div className="order-history-header">
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/products')}>Continue Shopping</span>
                        <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                        <span onClick={() => navigate('/dashboard')}>My Account</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    const filteredOrders = getFilteredOrders();

    return (
        <div className="order-history-container">
            {/* Header */}
            <div className="order-history-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/products')}>Continue Shopping</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                    <span onClick={() => navigate('/dashboard')}>My Account</span>
                </div>
            </div>

            <div className="order-history-main">
                <h2>My Orders</h2>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All Orders
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('confirmed')}
                    >
                        Confirmed
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'shipped' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('shipped')}
                    >
                        Shipped
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'delivered' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('delivered')}
                    >
                        Delivered
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('cancelled')}
                    >
                        Cancelled
                    </button>
                </div>

                {error && (
                    <div className="order-error">
                        <p>{error}</p>
                        <button onClick={fetchOrders}>Try Again</button>
                    </div>
                )}

                {filteredOrders.length === 0 && !error ? (
                    <div className="empty-orders">
                        <div className="empty-orders-icon">📦</div>
                        <h3>No Orders Found</h3>
                        <p>You haven't placed any orders yet.</p>
                        <button onClick={() => navigate('/products')} className="shop-now-btn">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <div key={order.orderId} className="order-card">
                                {/* Order Header */}
                                <div className="order-header">
                                    <div className="order-info">
                                        <span className="order-label">Order #</span>
                                        <span className="order-number">{order.orderId}</span>
                                        <span className="order-date">
                                            {new Date(order.orderDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="order-badges">
                                        <span className={`status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </span>
                                        <span className={`payment-badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="order-items-preview">
                                    <div className="items-count">
                                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                                    </div>
                                    <div className="items-thumbnails">
                                        {order.items && order.items.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="thumbnail">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.productName} />
                                                ) : (
                                                    <div className="no-image-thumb">No Image</div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items && order.items.length > 3 && (
                                            <div className="more-items">+{order.items.length - 3}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Footer */}
                                <div className="order-footer">
                                    <div className="order-total">
                                        <span>Total Amount:</span>
                                        <strong>${order.totalAmount.toFixed(2)}</strong>
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleViewOrder(order.orderId)}
                                        >
                                            View Details
                                        </button>
                                        {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                                            <button
                                                className="action-btn track-btn"
                                                onClick={() => handleTrackOrder(order.orderId)}
                                            >
                                                Track Order
                                            </button>
                                        )}
                                        {order.orderStatus === 'Delivered' && (
                                            <button
                                                className="action-btn reorder-btn"
                                                onClick={() => handleReorder(order.orderId)}
                                            >
                                                Reorder
                                            </button>
                                        )}
                                        {(order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed') && (
                                            <button
                                                className="action-btn cancel-btn"
                                                onClick={() => handleCancelOrder(order.orderId)}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderHistory;