import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminOrders.css';

function AdminOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        if (!token || userType !== 'Admin') {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/orders', {
                params: { status: filterStatus !== 'all' ? filterStatus : undefined }
            });
            setOrders(response.data);
        } catch (err) {
            setError('Failed to load orders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (orderId) => {
        try {
            const response = await api.get(`/admin/orders/${orderId}`);
            setSelectedOrder(response.data);
            setShowDetailModal(true);
        } catch (err) {
            alert('Failed to load order details');
        }
    };

    const getStatusClass = (status) => {
        switch(status?.toLowerCase()) {
            case 'delivered': return 'badge-delivered';
            case 'shipped': return 'badge-shipped';
            case 'confirmed': return 'badge-confirmed';
            case 'pending': return 'badge-pending';
            case 'cancelled': return 'badge-cancelled';
            default: return '';
        }
    };

    if (loading) return <div className="loading">Loading orders...</div>;

    return (
        <div className="admin-orders-container">
            <div className="admin-orders-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => navigate('/admin/disputes')}>Disputes</span>
                    <span onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</span>
                </div>
            </div>

            <div className="admin-orders-main">
                <h2>All Orders</h2>
                <div className="filter-tabs">
                    <button className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
                    <button className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>Pending</button>
                    <button className={`filter-tab ${filterStatus === 'confirmed' ? 'active' : ''}`} onClick={() => setFilterStatus('confirmed')}>Confirmed</button>
                    <button className={`filter-tab ${filterStatus === 'shipped' ? 'active' : ''}`} onClick={() => setFilterStatus('shipped')}>Shipped</button>
                    <button className={`filter-tab ${filterStatus === 'delivered' ? 'active' : ''}`} onClick={() => setFilterStatus('delivered')}>Delivered</button>
                    <button className={`filter-tab ${filterStatus === 'cancelled' ? 'active' : ''}`} onClick={() => setFilterStatus('cancelled')}>Cancelled</button>
                </div>

                {error && <div className="error">{error}</div>}

                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th><th>Dispute</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.orderId}>
                                    <td>#{order.orderId}</td>
                                    <td>{order.customerName}</td>
                                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td>${order.totalAmount.toFixed(2)}</td>
                                    <td><span className={`status-badge ${getStatusClass(order.orderStatus)}`}>{order.orderStatus}</span></td>
                                    <td>{order.paymentStatus}</td>
                                    <td>{order.hasDispute ? <span className="dispute-yes">⚠️ Yes</span> : 'No'}</td>
                                    <td><button onClick={() => handleViewOrder(order.orderId)}>View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showDetailModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Order #{selectedOrder.orderId}</h3><button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button></div>
                        <div className="modal-body">
                            <h4>Customer</h4><p>{selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
                            <h4>Shipping Address</h4><p>{selectedOrder.addressLine1}, {selectedOrder.city}, {selectedOrder.state} {selectedOrder.zipCode}, {selectedOrder.country}</p>
                            <h4>Items</h4>
                            <table className="items-table"><thead><tr><th>Product</th><th>Vendor</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>{selectedOrder.items?.map(item => (
                                <tr key={item.orderItemId}><td>{item.productName}</td><td>{item.vendorName}</td><td>{item.quantity}</td><td>${item.unitPrice.toFixed(2)}</td><td>${item.totalPrice.toFixed(2)}</td><td>{item.itemStatus}</td></tr>
                            ))}</tbody></table>
                            <div className="summary"><strong>Subtotal:</strong> ${selectedOrder.subTotal.toFixed(2)}<br/><strong>Shipping:</strong> ${selectedOrder.shippingCost.toFixed(2)}<br/><strong>Tax:</strong> ${selectedOrder.taxAmount.toFixed(2)}<br/><strong>Total:</strong> ${selectedOrder.totalAmount.toFixed(2)}</div>
                        </div>
                        <div className="modal-actions"><button onClick={() => setShowDetailModal(false)}>Close</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;