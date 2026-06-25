// src/components/AdminCategories.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminCategories.css';

function AdminCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [formData, setFormData] = useState({
        categoryName: '',
        description: '',
        parentCategoryId: '',
        imageUrl: ''
    });

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

        fetchCategories();
    }, [showInactive]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/categories?includeInactive=${showInactive}`);
            console.log('Categories response:', response.data);
            setCategories(response.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch categories', err);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);

            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                setTimeout(() => navigate('/login'), 2000);
            } else if (err.response?.status === 403) {
                setError('You don\'t have permission to access categories');
            } else {
                setError('Failed to load categories');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setFormData({
            categoryName: '',
            description: '',
            parentCategoryId: null,
            imageUrl: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            categoryName: category.categoryName,
            description: category.description || '',
            parentCategoryId: category.parentCategoryId || null,
            imageUrl: category.imageUrl || ''
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.categoryName.trim()) {
            alert('Category name is required');
            return;
        }

        setSubmitting(true);

        // Prepare data - convert empty strings properly
        const submitData = {
            categoryName: formData.categoryName,
            description: formData.description || null,
            parentCategoryId: formData.parentCategoryId === '' || formData.parentCategoryId === null ? null : parseInt(formData.parentCategoryId),
            imageUrl: formData.imageUrl || null
            // Remove isActive from here - let the server preserve existing status
        };

        console.log('Submitting category:', submitData);
        console.log('Editing category:', editingCategory);

        try {
            if (editingCategory) {
                // Update existing category - note the URL format
                const url = `/admin/categories/${editingCategory.categoryId}`;
                console.log('PUT Request URL:', url);

                const response = await api.put(url, submitData);
                console.log('Update response:', response.data);
                alert('Category updated successfully!');
            } else {
                // Create new category
                const response = await api.post('/admin/categories', submitData);
                console.log('Create response:', response.data);
                alert('Category added successfully!');
            }

            setShowModal(false);
            fetchCategories();
        } catch (err) {
            console.error('Failed to save category:', err);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);
            console.error('Request URL:', err.config?.url);
            console.error('Request method:', err.config?.method);

            let errorMessage = 'Failed to save category';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 404) {
                errorMessage = `API endpoint not found: ${err.config?.url}. Please check if the server is running.`;
            } else if (err.response?.status === 400) {
                errorMessage = err.response.data?.title || 'Invalid data sent to server';
            }

            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (categoryId, hasProducts, isActive) => {
        if (hasProducts) {
            alert('Cannot delete category with active products. Deactivate it instead.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/admin/categories/${categoryId}`);
            alert('Category deleted successfully');
            fetchCategories();
        } catch (err) {
            console.error('Failed to delete category', err);
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleToggleStatus = async (categoryId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            await api.put(`/admin/categories/${categoryId}/toggle-status`);
            alert(`Category ${newStatus ? 'activated' : 'deactivated'} successfully`);
            fetchCategories();
        } catch (err) {
            console.error('Failed to toggle category status', err);
            alert('Failed to update category status');
        }
    };

    const getParentCategoryName = (parentId) => {
        if (!parentId) return '—';
        const parent = categories.find(c => c.categoryId === parentId);
        return parent ? parent.categoryName : '—';
    };

    // Build hierarchical tree
    const buildCategoryTree = (parentId = null, level = 0) => {
        const children = categories.filter(c => c.parentCategoryId === parentId);
        return children.map(category => ({
            ...category,
            level
        })).concat(
            children.flatMap(category => buildCategoryTree(category.categoryId, level + 1))
        );
    };

    const hierarchicalCategories = buildCategoryTree();

    if (loading) {
        return (
            <div className="admin-categories-container">
                <div className="admin-categories-header">
                    <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-categories-container">
            {/* Header */}
            <div className="admin-categories-header">
                <h1 onClick={() => navigate('/admin-dashboard')}>SellPoint Admin</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/admin/vendors')}>Vendors</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className="admin-categories-main">
                <div className="page-header">
                    <h2>Category Management</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className="add-category-btn"
                            style={{
                                background: showInactive ? '#ed8936' : '#48bb78',
                                width: 'auto'
                            }}
                        >
                            {showInactive ? '📋 Showing All (Incl. Inactive)' : '✓ Show Active Only'}
                        </button>
                        <button className="add-category-btn" onClick={handleOpenAddModal}>
                            + Add New Category
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchCategories}>Retry</button>
                    </div>
                )}

                {categories.length === 0 && !error ? (
                    <div className="empty-categories">
                        <div className="empty-icon">📁</div>
                        <h3>No Categories Yet</h3>
                        <p>Create categories to organize products.</p>
                        <button onClick={handleOpenAddModal} className="add-first-btn">
                            Add First Category
                        </button>
                    </div>
                ) : (
                    <div className="categories-table-container">
                        <table className="categories-table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Description</th>
                                    <th>Parent Category</th>
                                    <th>Products</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hierarchicalCategories.map(category => (
                                    <tr key={category.categoryId} className={!category.isActive ? 'inactive-row' : ''}>
                                        <td className="category-name-cell">
                                            <div style={{ paddingLeft: `${category.level * 20}px` }}>
                                                {category.level > 0 && <span className="level-indent">└─ </span>}
                                                <span className="category-name">{category.categoryName}</span>
                                            </div>
                                        </td>
                                        <td className="description-cell">
                                            {category.description || '—'}
                                        </td>
                                        <td>{getParentCategoryName(category.parentCategoryId)}</td>
                                        <td className="products-count">
                                            {category.productCount || 0}
                                        </td>
                                        <td>
                                            <button
                                                className={`status-toggle ${category.isActive ? 'active' : 'inactive'}`}
                                                onClick={() => handleToggleStatus(category.categoryId, category.isActive)}
                                            >
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleOpenEditModal(category)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteCategory(category.categoryId, category.productCount > 0, category.isActive)}
                                                disabled={category.productCount > 0}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Category Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    name="categoryName"
                                    value={formData.categoryName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter category name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Parent Category (Optional)</label>
                                <select
                                    name="parentCategoryId"
                                    value={formData.parentCategoryId ?? ''}  // Convert null to empty string for select display
                                    onChange={handleInputChange}
                                >
                                    <option value="">— None (Top Level) —</option>
                                    {categories
                                        .filter(c => c.isActive && (!editingCategory || c.categoryId !== editingCategory.categoryId))
                                        .map(cat => (
                                            <option key={cat.categoryId} value={cat.categoryId}>
                                                {cat.categoryName}
                                            </option>
                                        ))}
                                </select>
                                <small>Select a parent category to create a subcategory</small>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Category description..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Image URL (Optional)</label>
                                <input
                                    type="text"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/category-image.jpg"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-modal-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-modal-btn" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCategories;