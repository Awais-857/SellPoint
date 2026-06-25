// src/components/Register.jsx
// Updated with file upload support for vendors

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        // Basic fields (all users)
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        userType: 'Customer',

        // Optional for all
        phoneNumber: '',
        dateOfBirth: '',

        // Vendor fields
        businessName: '',
        taxID: '',
        businessPhone: '',
        businessEmail: '',
        website: '',
        businessDescription: '',

        // Admin fields
        department: '',
        jobTitle: ''
    });

    const [files, setFiles] = useState({
        businessLicense: null,
        taxCertificate: null
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const fieldName = e.target.name;

        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError(`${fieldName} file size must be less than 5MB`);
                e.target.value = null; // Clear the input
                return;
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError(`${fieldName} must be PDF, JPEG, or PNG`);
                e.target.value = null; // Clear the input
                return;
            }

            // Clear any previous errors
            setError('');

            setFiles({
                ...files,
                [fieldName]: file
            });
        }
    };

    const handleUserTypeChange = (e) => {
        const newType = e.target.value;
        setFormData({
            ...formData,
            userType: newType,
            // Reset fields based on selection
            ...(newType === 'Customer' ? {
                businessName: '', taxID: '', businessPhone: '', businessEmail: '', website: '', businessDescription: '',
                department: '', jobTitle: ''
            } : newType === 'Vendor' ? {
                department: '', jobTitle: ''
            } : { // Admin
                businessName: '', taxID: '', businessPhone: '', businessEmail: '', website: '', businessDescription: ''
            })
        });

        // Clear files if switching away from vendor
        if (newType !== 'Vendor') {
            setFiles({
                businessLicense: null,
                taxCertificate: null
            });
        }
    };

    const validateForm = () => {
        // Password validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match!");
            return false;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }

        // Vendor-specific validation
if (formData.userType === 'Vendor') {
    if (!formData.businessName?.trim()) {
        setError("Business Name is required for vendors");
        return false;
    }
    if (!formData.taxID?.trim()) {
        setError("Tax ID / VAT Number is required for vendors");
        return false;
    }
    // Documents are optional – skip validation
}

        return true;
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const registerResponse = await api.post('/auth/register', formData);
        const { userId, uploadToken, userType } = registerResponse.data;
        
        if (userType === 'Vendor' && (files.businessLicense || files.taxCertificate)) {
            try {
                const uploadPromises = [];
                if (files.businessLicense) {
                    const fd = new FormData();
                    fd.append('userId', userId);
                    fd.append('token', uploadToken);
                    fd.append('documentType', 'BusinessLicense');
                    fd.append('file', files.businessLicense);  // lowercase 'file'
                    uploadPromises.push(api.post('/document/temp-upload', fd));
                }
                if (files.taxCertificate) {
                    const fd = new FormData();
                    fd.append('userId', userId);
                    fd.append('token', uploadToken);
                    fd.append('documentType', 'TaxCertificate');
                    fd.append('file', files.taxCertificate);   // lowercase 'file'
                    uploadPromises.push(api.post('/document/temp-upload', fd));
                }
                await Promise.all(uploadPromises);
            } catch (uploadErr) {
                console.error('Upload error:', uploadErr);
                alert('Account created but document upload failed. You can upload later via support.');
            }
        }
        
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
    } finally {
        setLoading(false);
    }
};

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Registration Successful!</h2>
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
                <h2>Create Account</h2>
                <p>Join SellPoint marketplace</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Basic Fields */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                placeholder="John"
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Username *</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="johndoe"
                        />
                    </div>

                    {/* User Type Selection */}
                    <div className="form-group">
                        <label>Register as *</label>
                        <select
                            name="userType"
                            value={formData.userType}
                            onChange={handleUserTypeChange}
                            required
                            className="form-select"
                        >
                            <option value="Customer">Customer</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    {/* Optional fields for all */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone Number (Optional)</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="123-456-7890"
                            />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth (Optional)</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Vendor Specific Fields */}
                    {formData.userType === 'Vendor' && (
                        <div className="vendor-fields">
                            <h3 style={{ margin: '20px 0 10px', color: '#4a5568' }}>Business Information</h3>

                            <div className="form-group">
                                <label>Business Name *</label>
                                <input
                                    type="text"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your Business Name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tax ID / VAT Number *</label>
                                <input
                                    type="text"
                                    name="taxID"
                                    value={formData.taxID}
                                    onChange={handleChange}
                                    required
                                    placeholder="XX-XXXXXXX"
                                />
                                <small>Format: XX-XXXXXXX</small>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Business Phone</label>
                                    <input
                                        type="tel"
                                        name="businessPhone"
                                        value={formData.businessPhone}
                                        onChange={handleChange}
                                        placeholder="Business phone"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Business Email</label>
                                    <input
                                        type="email"
                                        name="businessEmail"
                                        value={formData.businessEmail}
                                        onChange={handleChange}
                                        placeholder="business@email.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Website (Optional)</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://yourbusiness.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>Business Description</label>
                                <textarea
                                    name="businessDescription"
                                    value={formData.businessDescription}
                                    onChange={handleChange}
                                    placeholder="Describe your business..."
                                    rows="3"
                                />
                            </div>

                            {/* File Upload Section */}
                            <h3 style={{ margin: '20px 0 10px', color: '#4a5568' }}>Required Documents</h3>

                            <div className="form-group">
    <label>Business License (Optional)</label>
    <input type="file" name="businessLicense" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" style={{ padding: '5px' }} />
    <small>PDF, JPEG or PNG (Max 5MB) – Optional</small>
    {files.businessLicense && (
        <small style={{ color: '#48bb78', display: 'block', marginTop: '5px' }}>
            ✓ Selected: {files.businessLicense.name}
        </small>
    )}
</div>
<div className="form-group">
    <label>Tax Certificate (Optional)</label>
    <input type="file" name="taxCertificate" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" style={{ padding: '5px' }} />
    <small>PDF, JPEG or PNG (Max 5MB) – Optional</small>
    {files.taxCertificate && (
        <small style={{ color: '#48bb78', display: 'block', marginTop: '5px' }}>
            ✓ Selected: {files.taxCertificate.name}
        </small>
    )}
</div>
                        </div>
                    )}

                    {/* Admin Specific Fields */}
                    {formData.userType === 'Admin' && (
                        <div className="admin-fields">
                            <h3 style={{ margin: '20px 0 10px', color: '#4a5568' }}>Administrator Information</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="e.g., IT, Sales, Management"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Job Title</label>
                                    <input
                                        type="text"
                                        name="jobTitle"
                                        value={formData.jobTitle}
                                        onChange={handleChange}
                                        placeholder="e.g., System Admin, Manager"
                                    />
                                </div>
                            </div>

                            <div className="info-box" style={{ background: '#fff3cd', borderColor: '#ffc107' }}>
                                <p style={{ color: '#856404' }}>
                                    <strong>Note:</strong> Admin accounts have full system access. Use responsibly.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Password Fields */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                minLength="6"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' :
                            formData.userType === 'Vendor' ? 'Submit Vendor Application' :
                                formData.userType === 'Admin' ? 'Create Admin Account' : 'Register'}
                    </button>
                </form>

                <p className="auth-link">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;