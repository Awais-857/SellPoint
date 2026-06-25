import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDisputes.css';

function AdminDisputes() {
    const navigate = useNavigate();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [action, setAction] = useState('Resolve');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || localStorage.getItem('userType') !== 'Admin') {
            navigate('/login');
            return;
        }
        fetchDisputes();
    }, [filterStatus]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/disputes', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } });
            setDisputes(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (disputeId) => {
        if (!adminNotes.trim()) {
            alert('Please enter admin notes');
            return;
        }
        try {
            await api.post(`/admin/disputes/resolve/${disputeId}`, { adminNotes, action });
            alert('Dispute resolved successfully');
            fetchDisputes();
            setSelectedDispute(null);
            setAdminNotes('');
        } catch (err) {
            alert('Failed to resolve dispute');
        }
    };

    if (loading) return <div className="loading">Loading disputes...</div>;

    return (
        <div className="admin-disputes-container">
            <div className="admin-disputes-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => navigate('/admin/orders')}>Orders</span>
                    <span onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</span>
                </div>
            </div>
            <div className="admin-disputes-main">
                <h2>Dispute Resolution</h2>
                <div className="filter-tabs">
                    <button className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All</button>
                    <button className={`filter-tab ${filterStatus === 'Pending' ? 'active' : ''}`} onClick={() => setFilterStatus('Pending')}>Pending</button>
                    <button className={`filter-tab ${filterStatus === 'Resolved' ? 'active' : ''}`} onClick={() => setFilterStatus('Resolved')}>Resolved</button>
                </div>
                <div className="disputes-table-container">
                    <table className="disputes-table">
                        <thead><tr><th>Dispute ID</th><th>Order</th><th>Raised By</th><th>Reason</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                            {disputes.map(d => (
                                <tr key={d.disputeId}>
                                    <td>#{d.disputeId}</td>
                                    <td>#{d.orderId}</td>
                                    <td>{d.vendorName ? `Vendor: ${d.vendorName}` : `Customer: ${d.customerName}`}</td>
                                    <td>{d.reason.substring(0, 50)}...</td>
                                    <td>{d.status}</td>
                                    <td>{new Date(d.createdDate).toLocaleDateString()}</td>
                                    <td><button onClick={() => setSelectedDispute(d)}>Resolve</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDispute && (
                <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Resolve Dispute #{selectedDispute.disputeId}</h3><button className="close-btn" onClick={() => setSelectedDispute(null)}>×</button></div>
                        <div className="modal-body">
                            <p><strong>Order:</strong> #{selectedDispute.orderId}</p>
                            <p><strong>Reason:</strong> {selectedDispute.reason}</p>
                            <div className="form-group"><label>Admin Notes:</label><textarea rows="3" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Enter resolution notes..." /></div>
                            <div className="form-group"><label>Action:</label><select value={action} onChange={e => setAction(e.target.value)}><option value="Resolve">Mark as Resolved</option><option value="CancelOrder">Cancel Order</option><option value="Refund">Refund Order</option></select></div>
                        </div>
                        <div className="modal-actions"><button onClick={() => handleResolve(selectedDispute.disputeId)}>Submit Resolution</button><button onClick={() => setSelectedDispute(null)}>Cancel</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDisputes;