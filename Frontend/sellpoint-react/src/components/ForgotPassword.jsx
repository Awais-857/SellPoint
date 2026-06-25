// src/components/ForgotPassword.jsx
// This is the Forgot Password page

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });

            // Store the message
            setMessage(response.data.message || 'Password reset link sent!');

            // FIXED: Store the reset token if it's returned
            if (response.data.resetToken) {
                localStorage.setItem('lastResetToken', response.data.resetToken);
            }

            setSubmitted(true);
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Email not found');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>

                {!submitted ? (
                    <>
                        <p>Enter your email address and we'll send you a link to reset your password.</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <p>{message}</p>
                        <p>Check your email and click the link to reset your password.</p>

                        {/* FIXED: Properly capture and store the reset token */}
                        {(() => {
                            // Get the resetToken from localStorage (set in handleSubmit)
                            const resetToken = localStorage.getItem('lastResetToken');
                            if (resetToken) {
                                return (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '10px',
                                        background: '#e2e8f0',
                                        borderRadius: '5px',
                                        fontSize: '12px',
                                        wordBreak: 'break-all'
                                    }}>
                                        <strong>Reset Link:</strong><br />
                                        <a
                                            href={`${window.location.origin}/reset-password?token=${resetToken}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Click here to reset your password
                                        </a>
                                        <p style={{ marginTop: '5px', color: '#666', fontSize: '11px' }}>
                                            Token: {resetToken.substring(0, 20)}... (valid for 24 hours)
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                <p className="auth-link">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;