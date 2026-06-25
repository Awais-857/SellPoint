import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminReviews.css';

function AdminReviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        if (!token || userType !== 'Admin') {
            navigate('/login');
            return;
        }
        fetchPendingReviews();
    }, []);

    const fetchPendingReviews = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/reviews/pending');
            setReviews(response.data);
        } catch (err) {
            setError('Failed to load pending reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId) => {
    try {
        const response = await api.put(`/admin/reviews/${reviewId}/approve`);
        if (response.status === 200) {
            setReviews(reviews.filter(r => r.reviewId !== reviewId));
            alert('Review approved successfully');
        }
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to approve review');
    }
};

    if (loading) return <div className="loading">Loading pending reviews...</div>;

    return (
        <div className="admin-reviews-container">
            <div className="admin-reviews-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => navigate('/admin/orders')}>Orders</span>
                    <span onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</span>
                </div>
            </div>
            <div className="admin-reviews-main">
                <h2>Pending Reviews</h2>
                {error && <div className="error">{error}</div>}
                {reviews.length === 0 ? (
                    <div className="no-reviews">No pending reviews.</div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map(review => (
                            <div key={review.reviewId} className="review-card">
                                <div className="review-header">
                                    <span className="product-name">{review.productName}</span>
                                    <span className="rating">{'★'.repeat(review.rating)}</span>
                                    <span className="customer">{review.customerName}</span>
                                    <span className="date">{new Date(review.createdDate).toLocaleDateString()}</span>
                                </div>
                                <div className="review-comment">{review.comment || 'No comment'}</div>
                                <button onClick={() => handleApprove(review.reviewId)} className="approve-btn">Approve</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminReviews;