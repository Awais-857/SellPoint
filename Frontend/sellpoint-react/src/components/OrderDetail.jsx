// src/components/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './OrderDetail.css';

function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [showDisputeForm, setShowDisputeForm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        setError('');

        try {
            // Fetch order details
            const orderResponse = await api.get(`/orders/${id}`);
            setOrder(orderResponse.data);

            // Fetch order items
            const itemsResponse = await api.get(`/orders/${id}/items`);
            setOrderItems(itemsResponse.data);
        } catch (err) {
            console.error('Failed to fetch order details', err);
            setError('Failed to load order details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            return;
        }

        setCancelling(true);
        try {
            await api.put(`/orders/${id}/cancel`);
            alert('Order cancelled successfully');
            fetchOrderDetails(); // Refresh order details
        } catch (err) {
            console.error('Failed to cancel order', err);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const handleReorder = async () => {
        try {
            const response = await api.post(`/orders/${id}/reorder`);
            if (response.data.success) {
                alert('Items added to cart!');
                navigate('/cart');
            }
        } catch (err) {
            console.error('Failed to reorder', err);
            alert('Failed to add items to cart. Please try again.');
        }
    };

    const handleTrackOrder = () => {
        navigate(`/order-tracking/${id}`);
    };

    const handleWriteReview = (productId, orderItemId) => {
        navigate(`/product/${productId}/review`, { state: { orderItemId } });
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

    const getPaymentBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
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

    const handleRaiseDispute = async () => {
        if (!disputeReason.trim()) {
            alert('Please enter a reason');
            return;
        }
        try {
            await api.post(`/orders/${order.orderId}/dispute`, { reason: disputeReason });
            alert('Dispute raised successfully. Admin will review.');
            setShowDisputeForm(false);
        } catch (err) {
            alert('Failed to raise dispute');
        }
    };

    const getItemStatusBadge = (status) => {
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

    if (loading) {
        return (
            <div className="order-detail-container">
                <div className="order-detail-header">
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/order-history')}>← Back to Orders</span>
                        <span onClick={() => navigate('/products')}>Continue Shopping</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="order-detail-container">
                <div className="order-detail-header">
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/order-history')}>← Back to Orders</span>
                    </div>
                </div>
                <div className="error-state">
                    <p>{error || 'Order not found'}</p>
                    <button onClick={() => navigate('/order-history')}>Back to Orders</button>
                </div>
            </div>
        );
    }

    return (
        <div className="order-detail-container">
            {/* Header */}
            <div className="order-detail-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/order-history')}>← Back to Orders</span>
                    <span onClick={() => navigate('/products')}>Continue Shopping</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                </div>
            </div>

            <div className="order-detail-main">
                {/* Page Title */}
                <div className="page-title">
                    <h2>Order Details</h2>
                    <p>Order #{order.orderId}</p>
                </div>

                {/* Order Status Timeline */}
                <div className="status-timeline">
                    <div className={`timeline-step ${order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed' || order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <div className="step-content">
                            <strong>Order Placed</strong>
                            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className={`timeline-step ${order.orderStatus === 'Confirmed' || order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <div className="step-content">
                            <strong>Order Confirmed</strong>
                            <span>{order.confirmedDate ? new Date(order.confirmedDate).toLocaleDateString() : 'Pending'}</span>
                        </div>
                    </div>
                    <div className={`timeline-step ${order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <div className="step-content">
                            <strong>Shipped</strong>
                            <span>{order.shippedDate ? new Date(order.shippedDate).toLocaleDateString() : 'Pending'}</span>
                        </div>
                    </div>
                    <div className={`timeline-step ${order.orderStatus === 'Delivered' ? 'completed' : ''}`}>
                        <div className="step-dot"></div>
                        <div className="step-content">
                            <strong>Delivered</strong>
                            <span>{order.deliveredDate ? new Date(order.deliveredDate).toLocaleDateString() : 'Pending'}</span>
                        </div>
                    </div>
                </div>

                {/* Order Info Cards */}
                <div className="info-grid">
                    <div className="info-card">
                        <h3>Order Information</h3>
                        <div className="info-row">
                            <span>Order Date:</span>
                            <strong>{new Date(order.orderDate).toLocaleString()}</strong>
                        </div>
                        <div className="info-row">
                            <span>Order Status:</span>
                            <span className={`status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                {order.orderStatus}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Payment Status:</span>
                            <span className={`payment-badge ${getPaymentBadgeClass(order.paymentStatus)}`}>
                                {order.paymentStatus}
                            </span>
                        </div>
                        <div className="info-row">
                            <span>Payment Method:</span>
                            <strong>{order.paymentMethod}</strong>
                        </div>
                        {order.trackingNumber && (
                            <div className="info-row">
                                <span>Tracking Number:</span>
                                <strong>{order.trackingNumber}</strong>
                            </div>
                        )}
                    </div>

                    <div className="info-card">
                        <h3>Shipping Address</h3>
                        <div className="address-details">
                            <p>{order.addressLine1}</p>
                            {order.addressLine2 && <p>{order.addressLine2}</p>}
                            <p>{order.city}, {order.state} {order.zipCode}</p>
                            <p>{order.country}</p>
                        </div>
                        {order.estimatedDeliveryDate && (
                            <div className="delivery-estimate">
                                <span>📅 Estimated Delivery:</span>
                                <strong>{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Items */}
                <div className="items-section">
                    <h3>Order Items</h3>
                    <div className="items-table">
                        <div className="items-header">
                            <span className="col-product">Product</span>
                            <span className="col-price">Price</span>
                            <span className="col-quantity">Quantity</span>
                            <span className="col-total">Total</span>
                            <span className="col-status">Status</span>
                            <span className="col-action">Action</span>
                        </div>
                        <div className="items-body">
                            {orderItems.map(item => (
                                <div key={item.orderItemId} className="order-item-row">
                                    <div className="col-product">
                                        <div
                                            className="item-image"
                                            onClick={() => navigate(`/product/${item.productId}`)}
                                        >
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.productName} />
                                            ) : (
                                                <div className="no-image-small">No Image</div>
                                            )}
                                        </div>
                                        <div className="item-info">
                                            <div
                                                className="item-name"
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            >
                                                {item.productName}
                                            </div>
                                            <div className="item-vendor">Sold by: {item.vendorName}</div>
                                            {item.sku && <div className="item-sku">SKU: {item.sku}</div>}
                                        </div>
                                    </div>
                                    <div className="col-price">
                                        ${item.unitPrice.toFixed(2)}
                                    </div>
                                    <div className="col-quantity">
                                        {item.quantity}
                                    </div>
                                    <div className="col-total">
                                        ${item.totalPrice.toFixed(2)}
                                    </div>
                                    <div className="col-status">
                                        <span className={`item-status ${getItemStatusBadge(item.itemStatus)}`}>
                                            {item.itemStatus}
                                        </span>
                                    </div>
                                    <div className="col-action">
                                        {item.itemStatus?.toLowerCase() === 'delivered' && (
                                            <button
                                                className="review-btn"
                                                onClick={() => handleWriteReview(item.productId, item.orderItemId)}
                                            >
                                                Write Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="summary-section">
                    <div className="summary-card">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${order.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>${order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax (10%)</span>
                            <span>${order.taxAmount.toFixed(2)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="summary-row discount">
                                <span>Discount</span>
                                <span>-${order.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-divider"></div>
                        <div className="summary-row total">
                            <span>Total Amount</span>
                            <span>${order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-section">
                    {(order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed') && (
                        <button
                            onClick={handleCancelOrder}
                            className="cancel-order-btn"
                            disabled={cancelling}
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                    )}
                    {order.orderStatus === 'Shipped' && (
                        <button onClick={handleTrackOrder} className="track-btn">
                            Track Order
                        </button>
                    )}
                    {order.orderStatus === 'Delivered' && (
                        <button onClick={handleReorder} className="reorder-btn">
                            Reorder
                        </button>
                    )}
                    {(order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered') && (
                        <button className="dispute-btn" onClick={() => setShowDisputeForm(true)}>Raise Dispute</button>
                    )}

                    {showDisputeForm && (
                        <div className="dispute-form">
                            <textarea placeholder="Explain your issue..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} />
                            <button onClick={handleRaiseDispute}>Submit Dispute</button>
                            <button onClick={() => setShowDisputeForm(false)}>Cancel</button>
                        </div>
                    )}
                </div>

                {/* Help Section */}
                <div className="help-section">
                    <h4>Need Help With Your Order?</h4>
                    <p>If you have any questions or issues with your order, please contact our support team.</p>
                    <div className="help-contacts">
                        <span>📧 support@sellpoint.com</span>
                        <span>📞 +1 (555) 123-4567</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;