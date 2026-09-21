import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './AdminReviews.module.css';

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

    if (loading) return <div className={styles['loading']}>Loading pending reviews...</div>;

    return (
        <div className={styles['admin-reviews-container']}>
            <div className={styles['admin-reviews-header']}>
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className={styles['header-links']}>
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => navigate('/admin/categories')}>Categories</span>
                    <span onClick={() => navigate('/admin/orders')}>Orders</span>
                    <span onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</span>
                </div>
            </div>
            <div className={styles['admin-reviews-main']}>
                <h2>Pending Reviews</h2>
                {error && <div className={styles['error']}>{error}</div>}
                {reviews.length === 0 ? (
                    <div className={styles['no-reviews']}>No pending reviews.</div>
                ) : (
                    <div className={styles['reviews-list']}>
                        {reviews.map(review => (
                            <div key={review.reviewId} className={styles['review-card']}>
                                <div className={styles['review-header']}>
                                    <span className={styles['product-name']}>{review.productName}</span>
                                    <span className={styles['rating']}>{'★'.repeat(review.rating)}</span>
                                    <span className={styles['customer']}>{review.customerName}</span>
                                    <span className={styles['date']}>{new Date(review.createdDate).toLocaleDateString()}</span>
                                </div>
                                <div className={styles['review-comment']}>{review.comment || 'No comment'}</div>
                                <button onClick={() => handleApprove(review.reviewId)} className={styles['approve-btn']}>Approve</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminReviews;