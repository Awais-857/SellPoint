// src/components/AdminVendors.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminVendors.css';

function AdminVendors() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [vendorToApprove, setVendorToApprove] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

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

        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/vendors');
            console.log('Vendors response:', response.data); // Debug log
            setVendors(response.data);
            if (response.data.length === 0) {
                setError(''); // Clear error, just show empty state
            }
        } catch (err) {
            console.error('Failed to fetch vendors', err);
            // Show more detailed error message
            if (err.response) {
                setError(`Error ${err.response.status}: ${err.response.data?.message || err.response.statusText || 'Failed to load vendors'}`);
            } else if (err.request) {
                setError('Cannot connect to server. Make sure backend is running.');
            } else {
                setError('Failed to load vendors: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewVendor = (vendor) => {
        setSelectedVendor(vendor);
        setShowDetailModal(true);
    };

    const handleApproveVendor = (vendor) => {
        setVendorToApprove(vendor);
        setRejectionReason('');
        setShowApproveModal(true);
    };

    const handleRejectVendor = (vendor) => {
        setVendorToApprove(vendor);
        setRejectionReason('');
        setShowApproveModal(true);
    };

    const submitApproval = async (action) => {
        setActionLoading(true);
        try {
            if (action === 'approve') {
                await api.post('/admin/vendors/approve', {
                    userId: vendorToApprove.userId,
                    status: 'Approved'
                });
                alert('Vendor approved successfully!');
            } else {
                if (!rejectionReason.trim()) {
                    alert('Please provide a rejection reason');
                    setActionLoading(false);
                    return;
                }
                await api.post('/admin/vendors/reject', {
                    userId: vendorToApprove.userId,
                    status: 'Rejected',
                    rejectionReason: rejectionReason
                });
                alert('Vendor rejected successfully!');
            }
            setShowApproveModal(false);
            setVendorToApprove(null);
            fetchVendors(); // Refresh list
        } catch (err) {
            console.error('Failed to process vendor', err);
            alert(err.response?.data?.message || 'Failed to process vendor');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspendVendor = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} this vendor?`)) {
            return;
        }

        try {
            await api.put(`/admin/vendors/${userId}/toggle-status`);
            alert(`Vendor ${newStatus === 'Suspended' ? 'suspended' : 'activated'} successfully`);
            fetchVendors();
        } catch (err) {
            console.error('Failed to toggle vendor status', err);
            alert('Failed to update vendor status');
        }
    };

    const getFilteredVendors = () => {
        if (filterStatus === 'all') {
            return vendors;
        }
        return vendors.filter(vendor => vendor.approvalStatus?.toLowerCase() === filterStatus);
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'badge-approved';
            case 'pending':
                return 'badge-pending';
            case 'rejected':
                return 'badge-rejected';
            case 'suspended':
                return 'badge-suspended';
            default:
                return 'badge-default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="admin-vendors-container">
                <div className="admin-vendors-header">
                    <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/admin/categories')}>Categories</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading vendors...</p>
                </div>
            </div>
        );
    }

    const filteredVendors = getFilteredVendors();

    return (
        <div className="admin-vendors-container">
            {/* Header */}
            <div className="admin-vendors-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className="admin-vendors-main">
                <div className="page-header">
                    <h2>Vendor Management</h2>
                    <div className="stats-summary">
                        <span className="stat">Total: {vendors.length}</span>
                        <span className="stat pending">Pending: {vendors.filter(v => v.approvalStatus === 'Pending').length}</span>
                        <span className="stat approved">Approved: {vendors.filter(v => v.approvalStatus === 'Approved').length}</span>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All Vendors
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending Approval
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('rejected')}
                    >
                        Rejected
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'suspended' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('suspended')}
                    >
                        Suspended
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchVendors}>Retry</button>
                    </div>
                )}

                {filteredVendors.length === 0 && !error ? (
                    <div className="empty-vendors">
                        <div className="empty-icon">👥</div>
                        <h3>No Vendors Found</h3>
                        <p>{filterStatus === 'pending' ? 'No vendors waiting for approval.' : 'No vendors registered yet.'}</p>
                    </div>
                ) : (
                    <div className="vendors-table-container">
                        <table className="vendors-table">
                            <thead>
                                <tr>
                                    <th>Business Name</th>
                                    <th>Owner</th>
                                    <th>Email</th>
                                    <th>Registered</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVendors.map(vendor => (
                                    <tr key={vendor.userId}>
                                        <td className="business-name-cell">
                                            <div className="business-name">{vendor.businessName}</div>
                                            {vendor.taxId && <div className="tax-id">Tax ID: {vendor.taxId}</div>}
                                        </td>
                                        <td>{vendor.ownerName}</td>
                                        <td>{vendor.email}</td>
                                        <td>{formatDate(vendor.registeredDate)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(vendor.approvalStatus)}`}>
                                                {vendor.approvalStatus}
                                            </span>
                                            {vendor.isActive === false && vendor.approvalStatus === 'Approved' && (
                                                <span className="suspended-badge">Suspended</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewVendor(vendor)}
                                            >
                                                View
                                            </button>
                                            {vendor.approvalStatus === 'Pending' && (
                                                <>
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => handleApproveVendor(vendor)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="reject-btn"
                                                        onClick={() => handleRejectVendor(vendor)}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {vendor.approvalStatus === 'Approved' && (
                                                <button
                                                    className={`suspend-btn ${vendor.isActive === false ? 'activate' : ''}`}
                                                    onClick={() => handleSuspendVendor(vendor.userId, vendor.isActive ? 'Active' : 'Suspended')}
                                                >
                                                    {vendor.isActive === false ? 'Activate' : 'Suspend'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Vendor Detail Modal */}
            {showDetailModal && selectedVendor && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content vendor-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedVendor.businessName}</h3>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Business Information */}
                            <div className="detail-section">
                                <h4>Business Information</h4>
                                <div className="detail-row">
                                    <span>Business Name:</span>
                                    <strong>{selectedVendor.businessName}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Tax ID:</span>
                                    <strong>{selectedVendor.taxId || 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Business Phone:</span>
                                    <strong>{selectedVendor.businessPhone || 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Business Email:</span>
                                    <strong>{selectedVendor.businessEmail || 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Website:</span>
                                    <strong>{selectedVendor.website || 'N/A'}</strong>
                                </div>
                                {selectedVendor.businessDescription && (
                                    <div className="detail-row">
                                        <span>Description:</span>
                                        <strong>{selectedVendor.businessDescription}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Owner Information */}
                            <div className="detail-section">
                                <h4>Owner Information</h4>
                                <div className="detail-row">
                                    <span>Name:</span>
                                    <strong>{selectedVendor.ownerName}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Email:</span>
                                    <strong>{selectedVendor.email}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Phone:</span>
                                    <strong>{selectedVendor.phoneNumber || 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Registered:</span>
                                    <strong>{formatDate(selectedVendor.registeredDate)}</strong>
                                </div>
                            </div>

                            {/* Documents */}
                            {selectedVendor.documents && selectedVendor.documents.length > 0 && (
                                <div className="detail-section">
                                    <h4>Uploaded Documents</h4>
                                    <div className="documents-list">
                                        {selectedVendor.documents.map((doc, idx) => (
                                            <div key={idx} className="document-item">
                                                <span className="doc-name">📄 {doc.fileName}</span>
                                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="doc-link">
                                                    View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Information */}
                            <div className="detail-section">
                                <h4>Status Information</h4>
                                <div className="detail-row">
                                    <span>Approval Status:</span>
                                    <span className={`status-badge ${getStatusBadgeClass(selectedVendor.approvalStatus)}`}>
                                        {selectedVendor.approvalStatus}
                                    </span>
                                </div>
                                {selectedVendor.approvedDate && (
                                    <div className="detail-row">
                                        <span>Approved/Rejected Date:</span>
                                        <strong>{formatDate(selectedVendor.approvedDate)}</strong>
                                    </div>
                                )}
                                {selectedVendor.rejectionReason && (
                                    <div className="detail-row">
                                        <span>Rejection Reason:</span>
                                        <strong className="rejection-text">{selectedVendor.rejectionReason}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="close-modal-btn" onClick={() => setShowDetailModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve/Reject Modal */}
            {showApproveModal && vendorToApprove && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content approve-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{vendorToApprove.businessName}</h3>
                            <button className="close-btn" onClick={() => setShowApproveModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <p className="confirm-message">
                                Are you sure you want to <strong>{vendorToApprove.approvalStatus === 'Pending' ? 'approve' : 'reject'}</strong> this vendor?
                            </p>

                            {vendorToApprove.approvalStatus !== 'Pending' && (
                                <div className="form-group">
                                    <label>Rejection Reason:</label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows="3"
                                        placeholder="Please provide a reason for rejection..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-modal-btn" onClick={() => setShowApproveModal(false)}>
                                Cancel
                            </button>
                            {vendorToApprove.approvalStatus === 'Pending' ? (
                                <button
                                    className="approve-modal-btn"
                                    onClick={() => submitApproval('approve')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : 'Approve Vendor'}
                                </button>
                            ) : (
                                <button
                                    className="reject-modal-btn"
                                    onClick={() => submitApproval('reject')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : 'Reject Vendor'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminVendors;