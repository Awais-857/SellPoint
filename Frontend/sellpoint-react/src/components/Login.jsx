// src/components/Login.jsx
// This is the Login Form page

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

function Login() {
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', formData);

            // Save token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('userEmail', response.data.email);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('userType', response.data.userType);

            // Redirect based on user type
            switch (response.data.userType) {
                case 'Admin':
                    navigate('/admin-dashboard');
                    break;
                case 'Vendor':
                    navigate('/vendor-dashboard');
                    break;
                default:
                    navigate('/customer-dashboard');
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'Login failed');
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
                <h2>Welcome Back</h2>
                <p>Login to your SellPoint account</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username or Email</label>
                        <input
                            type="text"
                            name="usernameOrEmail"
                            value={formData.usernameOrEmail}
                            onChange={handleChange}
                            required
                            placeholder="Enter username or email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter password"
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/forgot-password">Forgot Password?</Link>
                    <p>
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;