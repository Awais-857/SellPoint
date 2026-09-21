// src/components/VendorProducts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './VendorProducts.module.css';

function VendorProducts() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        productName: '',
        categoryId: '',
        description: '',
        price: '',
        stockQuantity: '',
        discountPercent: '0',
        sku: '',
        imageUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        if (!token) {
            navigate('/login');
            return;
        }
        if (userType !== 'Vendor') {
            navigate('/dashboard');
            return;
        }

        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/vendor/products');
            setProducts(response.data);
        } catch (err) {
            console.error('Failed to fetch products', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories from: /api/admin/public/categories');
            // Change this line to use the admin public endpoint
            const response = await api.get('/admin/public/categories');
            console.log('Categories response:', response.data);

            setCategories(response.data);

            if (response.data.length === 0) {
                console.warn('No active categories found!');
                alert('No categories available. Please contact admin to create categories first.');
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setFormData({
            productName: '',
            categoryId: '',
            description: '',
            price: '',
            stockQuantity: '',
            discountPercent: '0',
            sku: '',
            imageUrl: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            productName: product.productName,
            categoryId: product.categoryId,
            description: product.description || '',
            price: product.price,
            stockQuantity: product.stockQuantity,
            discountPercent: product.discountPercent || '0',
            sku: product.sku || '',
            imageUrl: product.imageUrl || ''
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation
        if (!formData.productName.trim()) {
            alert('Product name is required');
            return;
        }
        if (!formData.categoryId) {
            alert('Please select a category');
            return;
        }
        // Check if category exists in the list
        const selectedCategory = categories.find(c => c.categoryId === parseInt(formData.categoryId));
        if (!selectedCategory) {
            alert('Please select a valid category');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }
        if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
            alert('Please enter a valid stock quantity');
            return;
        }

        setSubmitting(true);

        try {
            if (editingProduct) {
                // Update existing product
                await api.put(`/vendor/products/${editingProduct.productId}`, formData);
                alert('Product updated successfully!');
            } else {
                // Create new product
                await api.post('/vendor/products', formData);
                alert('Product added successfully!');
            }

            setShowModal(false);
            fetchProducts(); // Refresh list
        } catch (err) {
            console.error('Failed to save product', err);
            alert(err.response?.data?.message || 'Failed to save product. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        setDeleteConfirm(productId);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/vendor/products/${deleteConfirm}`);
            alert('Product deleted successfully');
            fetchProducts();
        } catch (err) {
            console.error('Failed to delete product', err);
            alert('Failed to delete product. Please try again.');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleToggleStatus = async (productId, currentStatus) => {
        try {
            await api.put(`/vendor/products/${productId}/toggle-status`);
            fetchProducts();
        } catch (err) {
            console.error('Failed to toggle product status', err);
            alert('Failed to update product status');
        }
    };

    const formatPrice = (price) => {
        return parseFloat(price).toFixed(2);
    };

    if (loading) {
        return (
            <div className={styles['vendor-products-container']}>
                <div className={styles['vendor-products-header']}>
                    <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                    <div className={styles['header-links']}>
                        <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                        <span onClick={() => navigate('/vendor/orders')}>Orders</span>
                        <span onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}>Logout</span>
                    </div>
                </div>
                <div className={styles['loading-state']}>
                    <div className={styles['spinner']}></div>
                    <p>Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['vendor-products-container']}>
            {/* Header */}
            <div className={styles['vendor-products-header']}>
                <h1 onClick={() => navigate('/dashboard')}>SellPoint Vendor</h1>
                <div className={styles['header-links']}>
                    <span onClick={() => navigate('/vendor-dashboard')}>Dashboard</span>
                    <span onClick={() => navigate('/vendor/orders')}>Orders</span>
                    <span onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>Logout</span>
                </div>
            </div>

            <div className={styles['vendor-products-main']}>
                <div className={styles['page-header']}>
                    <h2>Product Management</h2>
                    <button className={styles['add-product-btn']} onClick={handleOpenAddModal}>
                        + Add New Product
                    </button>
                </div>

                {error && (
                    <div className={styles['error-message']}>
                        <p>{error}</p>
                        <button onClick={fetchProducts}>Retry</button>
                    </div>
                )}

                {products.length === 0 && !error ? (
                    <div className={styles['empty-products']}>
                        <div className={styles['empty-icon']}>📦</div>
                        <h3>No Products Yet</h3>
                        <p>Start adding products to your store.</p>
                        <button onClick={handleOpenAddModal} className={styles['add-first-btn']}>
                            Add Your First Product
                        </button>
                    </div>
                ) : (
                    <div className={styles['products-table-container']}>
                        <table className={styles['products-table']}>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Discount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.productId}>
                                        <td className={styles['product-image-cell']}>
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    className={styles['product-thumbnail']}
                                                    onClick={() => navigate(`/product/${product.productId}`)}
                                                />
                                            ) : (
                                                <div className={styles['no-thumbnail']}>No Image</div>
                                            )}
                                        </td>
                                        <td className={styles['product-name-cell']}>
                                            <div className={styles['product-name']}>{product.productName}</div>
                                            <div className={styles['product-sku']}>SKU: {product.sku || 'N/A'}</div>
                                        </td>
                                        <td>{product.categoryName}</td>
                                        <td className={styles['price-cell']}>${formatPrice(product.price)}</td>
                                        <td className={`stock-cell ${product.stockQuantity <= 5 ? 'low-stock' : ''}`}>
                                            {product.stockQuantity}
                                            {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                                                <span className={styles['low-stock-badge']}>Low Stock</span>
                                            )}
                                            {product.stockQuantity === 0 && (
                                                <span className={styles['out-of-stock-badge']}>Out of Stock</span>
                                            )}
                                        </td>
                                        <td>
                                            {product.discountPercent > 0 ? (
                                                <span className={styles['discount-badge']}>-{product.discountPercent}%</span>
                                            ) : (
                                                <span className={styles['no-discount']}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className={styles['status-toggle'] + ' ' + (product.isActive ? styles['active'] : styles['inactive'])}
                                                onClick={() => handleToggleStatus(product.productId, product.isActive)}
                                            >
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className={styles['actions-cell']}>
                                            <button
                                                className={styles['edit-btn']}
                                                onClick={() => handleOpenEditModal(product)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className={styles['delete-btn']}
                                                onClick={() => handleDeleteProduct(product.productId)}
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

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className={styles['modal-overlay']} onClick={() => setShowModal(false)}>
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={styles['modal-header']}>
                            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className={styles['close-btn']} onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles['form-group']}>
                                <label>Product Name *</label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div className={styles['form-row']}>
                                <div className={styles['form-group']}>
                                    <label>Category *</label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.length === 0 ? (
                                            <option value="" disabled>No categories available. Please contact admin.</option>
                                        ) : (
                                            categories.map(cat => (
                                                <option key={cat.categoryId} value={cat.categoryId}>
                                                    {cat.categoryName}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {categories.length === 0 && (
                                        <small style={{ color: '#f56565' }}>
                                            No categories found. Please ensure categories are created and active in the admin panel.
                                        </small>
                                    )}
                                </div>
                                <div className={styles['form-group']}>
                                    <label>SKU (Optional)</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        placeholder="Unique product code"
                                    />
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Product description..."
                                />
                            </div>

                            <div className={styles['form-row']}>
                                <div className={styles['form-group']}>
                                    <label>Price ($) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label>Stock Quantity *</label>
                                    <input
                                        type="number"
                                        name="stockQuantity"
                                        value={formData.stockQuantity}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                        placeholder="0"
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label>Discount (%)</label>
                                    <input
                                        type="number"
                                        name="discountPercent"
                                        value={formData.discountPercent}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        step="1"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label>Image URL (Optional)</label>
                                <input
                                    type="text"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <small>Enter a valid image URL or leave empty for no image</small>
                            </div>

                            <div className={styles['modal-actions']}>
                                <button type="button" className={styles['cancel-modal-btn']} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles['submit-modal-btn']} disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className={styles['modal-overlay']} onClick={() => setDeleteConfirm(null)}>
                    <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                        <div className={styles['modal-header']}>
                            <h3>Delete Product</h3>
                            <button className={styles['close-btn']} onClick={() => setDeleteConfirm(null)}>×</button>
                        </div>
                        <div className={styles['delete-confirm-content']}>
                            <p>Are you sure you want to delete this product?</p>
                            <p className={styles['delete-warning']}>This action cannot be undone.</p>
                        </div>
                        <div className={styles['modal-actions']}>
                            <button className={styles['cancel-modal-btn']} onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className={styles['delete-confirm-btn']} onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VendorProducts;