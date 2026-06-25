// src/components/OrderConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './OrderConfirmation.css';

function OrderConfirmation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const handleContinueShopping = () => {
        navigate('/products');
    };

    const handleViewOrders = () => {
        navigate('/order-history');
    };

    if (loading) {
        return (
            <div className="confirmation-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading order confirmation...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="confirmation-container">
                <div className="error-state">
                    <p>{error || 'Order not found'}</p>
                    <button onClick={() => navigate('/products')}>Back to Shop</button>
                </div>
            </div>
        );
    }

    return (
        <div className="confirmation-container">
            {/* Header */}
            <div className="confirmation-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-steps">
                    <span className="step completed">Cart</span>
                    <span className="step-separator">→</span>
                    <span className="step completed">Checkout</span>
                    <span className="step-separator">→</span>
                    <span className="step active">Confirmation</span>
                </div>
            </div>

            <div className="confirmation-main">
                {/* Success Message */}
                <div className="success-animation">
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Thank you for your purchase. Your order has been received.</p>
                </div>

                {/* Order Info */}
                <div className="order-info-card">
                    <div className="order-info-header">
                        <div>
                            <span className="order-label">Order Number</span>
                            <h3 className="order-number">#{order.orderId}</h3>
                        </div>
                        <div>
                            <span className="order-label">Order Date</span>
                            <p className="order-date">
                                {new Date(order.orderDate).toLocaleDateString()} at{' '}
                                {new Date(order.orderDate).toLocaleTimeString()}
                            </p>
                        </div>
                        <div>
                            <span className="order-label">Order Status</span>
                            <p className={`order-status ${order.orderStatus.toLowerCase()}`}>
                                {order.orderStatus}
                            </p>
                        </div>
                        <div>
                            <span className="order-label">Payment Status</span>
                            <p className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
                                {order.paymentStatus}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-confirmation">
                    <button onClick={handleContinueShopping} className="continue-btn">
                        Continue Shopping
                    </button>
                    <button onClick={handleViewOrders} className="orders-btn">
                        View My Orders
                    </button>
                </div>

                {/* Order Summary */}
                <div className="order-summary-card">
                    <h3>Order Summary</h3>

                    <div className="items-list">
                        {orderItems.map(item => (
                            <div key={item.orderItemId} className="order-item-confirmation">
                                <div className="item-image">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.productName} />
                                    ) : (
                                        <div className="no-image-small">No Image</div>
                                    )}
                                </div>
                                <div className="item-details">
                                    <h4>{item.productName}</h4>
                                    <p className="item-vendor">Sold by: {item.vendorName}</p>
                                    <p className="item-quantity">Quantity: {item.quantity}</p>
                                </div>
                                <div className="item-price">
                                    <span className="unit-price">${item.unitPrice.toFixed(2)} each</span>
                                    <span className="total-price">${item.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="summary-divider"></div>

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
                        <span>Total Paid</span>
                        <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="shipping-card">
                    <h3>Shipping Address</h3>
                    <div className="address-details">
                        <p>{order.addressLine1}</p>
                        {order.addressLine2 && <p>{order.addressLine2}</p>}
                        <p>{order.city}, {order.state} {order.zipCode}</p>
                        <p>{order.country}</p>
                    </div>

                    {order.trackingNumber && (
                        <div className="tracking-info">
                            <h4>Tracking Information</h4>
                            <p>Tracking Number: <strong>{order.trackingNumber}</strong></p>
                            <p className="delivery-estimate">
                                Estimated Delivery: {order.estimatedDeliveryDate || '5-7 business days'}
                            </p>
                        </div>
                    )}

                    {order.paymentMethod === 'CashOnDelivery' && (
                        <div className="payment-note cod-note">
                            💵 Cash on Delivery - Pay when you receive your order
                        </div>
                    )}

                    {order.paymentMethod === 'CreditCard' && (
                        <div className="payment-note card-note">
                            💳 Credit Card - Payment confirmed
                        </div>
                    )}
                </div>

                {/* What's Next */}
                <div className="next-steps-card">
                    <h3>What's Next?</h3>
                    <div className="steps-grid">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <strong>Order Confirmation</strong>
                                <p>You'll receive an email with your order details</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <strong>Processing</strong>
                                <p>Vendors will process and pack your items</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <strong>Shipping</strong>
                                <p>Your order will be shipped within 2-3 business days</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <strong>Delivery</strong>
                                <p>Estimated delivery in 5-7 business days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="help-card">
                    <h3>Need Help?</h3>
                    <p>If you have any questions about your order, please contact us:</p>
                    <div className="help-contacts">
                        <span>📧 support@sellpoint.com</span>
                        <span>📞 +1 (555) 123-4567</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderConfirmation;