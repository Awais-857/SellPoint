// src/components/ReviewForm.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './ReviewForm.css';

function ReviewForm() {
    const { id } = useParams(); // productId
    const location = useLocation();
    const navigate = useNavigate();
    const orderItemId = location.state?.orderItemId;

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!orderItemId) {
        return (
            <div className="review-form-container">
                <div className="review-form-card">
                    <h2>Invalid Request</h2>
                    <p>No order item specified. Please go back and try again.</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            setError('Please select a rating between 1 and 5');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await api.post('/reviews', {
                productId: parseInt(id),
                orderItemId: orderItemId,
                rating: rating,
                comment: comment
            });
            setSuccess(true);
            setTimeout(() => navigate(`/product/${id}`), 2000);
        } catch (err) {
            let errorMsg = err.response?.data?.message || 'Failed to submit review';
            if (errorMsg.toLowerCase().includes('already reviewed')) {
                errorMsg = 'You have already reviewed this product.';
            }
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="review-form-container">
                <div className="review-form-card">
                    <h2>Thank You!</h2>
                    <p>Your review has been submitted and will appear after admin approval.</p>
                    <button onClick={() => navigate(`/product/${id}`)}>Back to Product</button>
                </div>
            </div>
        );
    }

    return (
        <div className="review-form-container">
            <div className="review-form-card">
                <h2>Write a Review</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Rating *</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`star ${star <= rating ? 'selected' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Comment (Optional)</label>
                        <textarea
                            rows="5"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReviewForm;