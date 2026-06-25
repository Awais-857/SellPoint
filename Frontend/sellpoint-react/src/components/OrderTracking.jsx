import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './OrderTracking.css';

function OrderTracking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTracking();
    }, [id]);

    const fetchTracking = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/orders/${id}/tracking`);
            setTracking(response.data);
        } catch (err) {
            setError('Unable to load tracking information');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
        const currentIndex = steps.findIndex(s => s.toLowerCase() === status?.toLowerCase());
        return currentIndex;
    };

    if (loading) return <div className="tracking-loading">Loading tracking info...</div>;
    if (error || !tracking) return <div className="tracking-error">{error || 'Order not found'}</div>;

    const statusSteps = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
    const currentStep = getStatusStep(tracking.orderStatus);

    return (
        <div className="tracking-container">
            <div className="tracking-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/order-history')}>← Back to Orders</span>
                    <span onClick={() => navigate('/products')}>Continue Shopping</span>
                </div>
            </div>

            <div className="tracking-main">
                <h2>Order Tracking</h2>
                <p>Order #{tracking.orderId}</p>

                <div className="tracking-timeline">
                    {statusSteps.map((step, idx) => (
                        <div key={step} className={`timeline-step ${idx <= currentStep ? 'completed' : ''}`}>
                            <div className="step-dot"></div>
                            <div className="step-label">{step}</div>
                            {idx === currentStep && tracking.orderStatus === step && (
                                <div className="step-active">Current</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="tracking-details">
                    <div className="detail-card">
                        <h3>Tracking Information</h3>
                        <p><strong>Status:</strong> {tracking.orderStatus}</p>
                        {tracking.trackingNumber && <p><strong>Tracking Number:</strong> {tracking.trackingNumber}</p>}
                        <p><strong>Order Date:</strong> {new Date(tracking.orderDate).toLocaleDateString()}</p>
                        {tracking.estimatedDeliveryDate && (
                            <p><strong>Estimated Delivery:</strong> {new Date(tracking.estimatedDeliveryDate).toLocaleDateString()}</p>
                        )}
                    </div>

                    <div className="detail-card">
                        <h3>Shipping Address</h3>
                        <p>{tracking.shippingAddress}</p>
                    </div>

                    <div className="detail-card">
                        <h3>Order Summary</h3>
                        <p><strong>Total Items:</strong> {tracking.totalItems}</p>
                        <p><strong>Total Amount:</strong> ${tracking.totalAmount.toFixed(2)}</p>
                    </div>
                </div>

                <div className="tracking-actions">
                    <button onClick={() => navigate(`/order-detail/${tracking.orderId}`)}>View Full Order Details</button>
                </div>
            </div>
        </div>
    );
}

export default OrderTracking;