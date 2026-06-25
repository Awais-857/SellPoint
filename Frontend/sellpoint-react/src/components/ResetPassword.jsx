// src/components/ResetPassword.jsx
// This is the Reset Password page (accessed via link from email)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

function ResetPassword() {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Extract token from URL when component loads
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');

        if (tokenFromUrl) {
            setToken(tokenFromUrl);
            setTokenValid(true);
            // Optional: Clear the stored token since it's now being used
            localStorage.removeItem('lastResetToken');
        } else {
            setError('No reset token provided. Please request a new password reset link.');
        }
        setValidating(false);
    }, [location]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            setSuccess(response.data.message || 'Password reset successful!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Failed to reset password');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Validating Token...</h2>
                    <p>Please wait while we verify your reset link.</p>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Invalid Reset Link</h2>
                    <div className="error-message">{error}</div>
                    <p className="auth-link">
                        <Link to="/forgot-password">Request a new password reset</Link>
                    </p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Password Reset Successful!</h2>
                    <div className="success-message">{success}</div>
                    <p>Redirecting you to login page...</p>
                    <p className="auth-link">
                        <Link to="/login">Click here if not redirected</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Your Password</h2>
                <p>Enter your new password below.</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Enter new password"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm new password"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-link">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;