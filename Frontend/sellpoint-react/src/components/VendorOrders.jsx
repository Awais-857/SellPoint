// src/components/VendorOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './VendorOrders.css';

function VendorOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

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

        // fetch initial orders
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/vendor/orders');
            setOrders(response.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (order) => {
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
        // Fetch full order details (includes subTotal, shippingCost, taxAmount)
        const orderDetailsResponse = await api.get(`/orders/${order.orderId}`);
        const orderDetails = orderDetailsResponse.data;
        
        // Fetch order items
        const itemsResponse = await api.get(`/orders/${order.orderId}/items`);
        const orderItems = itemsResponse.data;
        
        // Merge the list data with the detailed data
        setSelectedOrder({
            ...order,
            ...orderDetails,
            items: orderItems
        });
    } catch (err) {
        console.error('Failed to fetch order details', err);
        alert('Failed to load order details. Please try again.');
        setShowDetailModal(false);
    } finally {
        setLoadingDetails(false);
    }
};

    const handleUpdateItemStatus = async (orderItemId, newStatus) => {
    if (!window.confirm(`Change item status to ${newStatus}?`)) return;
    
    setUpdatingStatus(true);
    try {
        await api.put(`/vendor/orders/${orderItemId}/status`, { status: newStatus });
        alert(`Order item status updated to ${newStatus}`);
        
        // Refresh the orders list to update previews
        await fetchOrders();
        
        // If modal is open, refresh selected order details
        if (selectedOrder) {
            const orderDetails = await api.get(`/orders/${selectedOrder.orderId}`);
            const orderItems = await api.get(`/orders/${selectedOrder.orderId}/items`);
            setSelectedOrder({
                ...selectedOrder,
                ...orderDetails.data,
                items: orderItems.data
            });
        }
    } catch (err) {
        console.error('Failed to update status', err);
        alert('Failed to update order status. Please try again.');
    } finally {
        setUpdatingStatus(false);
    }
};

    const getFilteredOrders = () => {
        if (filterStatus === 'all') {
            return orders;
        }
        return orders.filter(order => order.orderStatus?.toLowerCase() === filterStatus);
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
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

    const getItemStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'item-delivered';
            case 'shipped':
                return 'item-shipped';
            case 'pending':
                return 'item-pending';
            case 'returned':
                return 'item-returned';
            default:
                return 'item-default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="vendor-orders-container">
                <div className="vendor-orders-header">
                    <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/vendor/products')}>Products</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }

    const filteredOrders = getFilteredOrders();

    return (
        <div className="vendor-orders-container">
            {/* Header */}
            <div className="vendor-orders-header">
                <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/vendor/products')}>Products</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className="vendor-orders-main">
                <div className="page-header">
                    <h2>Customer Orders</h2>
                </div>

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
                </div>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchOrders}>Retry</button>
                    </div>
                )}

                {filteredOrders.length === 0 && !error ? (
                    <div className="empty-orders">
                        <div className="empty-icon">📦</div>
                        <h3>No Orders Yet</h3>
                        <p>When customers place orders, they will appear here.</p>
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
                                        <span className="order-date">{formatDate(order.orderDate)}</span>
                                    </div>
                                    <div className="order-badges">
                                        <span className={`status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </span>
                                        <span className="payment-badge payment-paid">
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="customer-info">
                                    <span>👤 {order.customerName}</span>
                                    {order.customerEmail && <span>📧 {order.customerEmail}</span>}
                                </div>

                                {/* Order Footer */}
                                <div className="order-footer">
                                    <div className="order-total">
                                        <span>Total:</span>
                                        <strong>${order.totalAmount?.toFixed(2) || '0.00'}</strong>
                                    </div>
                                    <button
                                        className="view-details-btn"
                                        onClick={() => handleViewOrder(order)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Order Details #{selectedOrder.orderId}</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {loadingDetails ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="spinner"></div>
                                    <p>Loading order details...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Customer Information */}
                                    <div className="detail-section">
                                <h4>Customer Information</h4>
                                <div className="detail-row">
                                    <span>Name:</span>
                                    <strong>{selectedOrder.customerName}</strong>
                                </div>
                                {selectedOrder.customerEmail && (
                                    <div className="detail-row">
                                        <span>Email:</span>
                                        <strong>{selectedOrder.customerEmail}</strong>
                                    </div>
                                )}
                                {selectedOrder.customerPhone && (
                                    <div className="detail-row">
                                        <span>Phone:</span>
                                        <strong>{selectedOrder.customerPhone}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.address && (
                                <div className="detail-section">
                                    <h4>Shipping Address</h4>
                                    <div className="address-details">
                                        <p>{selectedOrder.address.addressLine1}</p>
                                        {selectedOrder.address.addressLine2 && <p>{selectedOrder.address.addressLine2}</p>}
                                        <p>{selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipCode}</p>
                                        <p>{selectedOrder.address.country}</p>
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="detail-section">
                                <h4>Order Items</h4>
                                <div className="items-table">
                                    <div className="items-header">
                                        <span>Product</span>
                                        <span>Quantity</span>
                                        <span>Price</span>
                                        <span>Total</span>
                                        <span>Status</span>
                                        <span>Action</span>
                                    </div>
                                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="item-row">
                                            <div className="item-product">
                                                <div className="item-name">{item.productName}</div>
                                                {item.sku && <div className="item-sku">SKU: {item.sku}</div>}
                                            </div>
                                            <div className="item-qty">{item.quantity}</div>
                                            <div className="item-price">${item.unitPrice?.toFixed(2)}</div>
                                            <div className="item-total">${item.totalPrice?.toFixed(2)}</div>
                                            <div className="item-status">
                                                <span className={`item-status-badge ${getItemStatusBadgeClass(item.itemStatus)}`}>
                                                    {item.itemStatus}
                                                </span>
                                            </div>
                                            <div className="item-action">
                                                <select
                                                    className="status-select"
                                                    value={item.itemStatus?.toLowerCase() || 'pending'}
                                                    onChange={(e) => handleUpdateItemStatus(item.orderItemId, e.target.value)}
                                                    disabled={updatingStatus}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirm</option>
                                                    <option value="shipped">Ship</option>
                                                    <option value="delivered">Deliver</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="detail-section summary-section">
                                <h4>Order Summary</h4>
                                <div className="summary-row">
                                    <span>Subtotal:</span>
                                    <span>${selectedOrder.subTotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping:</span>
                                    <span>${selectedOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax:</span>
                                    <span>${selectedOrder.taxAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total:</span>
                                    <span>${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="close-modal-btn" onClick={() => setShowDetailModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorOrders;