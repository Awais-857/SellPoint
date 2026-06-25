// src/components/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);

            // Fetch related products from same category
            if (response.data.categoryId) {
                fetchRelatedProducts(response.data.categoryId, response.data.productId);
            }
        } catch (err) {
            console.error('Failed to fetch product', err);
            setError('Product not found');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/products/${id}/reviews`);
            setReviews(response.data);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        }
    };

    const fetchRelatedProducts = async (categoryId, currentProductId) => {
        try {
            const response = await api.get('/products', {
                params: {
                    categoryId: categoryId,
                    pageSize: 4
                }
            });
            // Filter out current product
            const related = (response.data.products || []).filter(p => p.productId !== currentProductId);
            setRelatedProducts(related.slice(0, 4));
        } catch (err) {
            console.error('Failed to fetch related products', err);
        }
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= (product?.stockQuantity || 10)) {
            setQuantity(value);
        }
    };

    const incrementQuantity = () => {
        if (quantity < (product?.stockQuantity || 10)) {
            setQuantity(quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleAddToCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setAddingToCart(true);
        try {
            await api.post('/cart/add', { productId: product.productId, quantity });
            alert(`${quantity} × ${product.productName} added to cart!`);
        } catch (err) {
            console.error('Failed to add to cart', err);
            alert('Failed to add to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        navigate('/cart');
    };

    const discountedPrice = product?.price * (1 - (product?.discountPercent || 0) / 100);
    const hasDiscount = (product?.discountPercent || 0) > 0;
    const savings = product?.price - discountedPrice;

    if (loading) {
        return (
            <div className="product-detail-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-detail-container">
                <div className="error-state">
                    <p>{error || 'Product not found'}</p>
                    <button onClick={() => navigate('/products')}>Back to Shop</button>
                </div>
            </div>
        );
    }

    return (
        <div className="product-detail-container">
            {/* Header */}
            <div className="detail-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/products')}>Continue Shopping</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                    <span onClick={() => navigate('/dashboard')}>My Account</span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span onClick={() => navigate('/products')}>Home</span>
                <span>&gt;</span>
                <span onClick={() => navigate(`/products?category=${product.categoryId}`)}>
                    {product.categoryName}
                </span>
                <span>&gt;</span>
                <span className="current">{product.productName}</span>
            </div>

            {/* Product Main Info */}
            <div className="product-main">
                {/* Product Images */}
                <div className="product-gallery">
                    <div className="main-image">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} />
                        ) : (
                            <div className="no-image-large">No Image Available</div>
                        )}
                        {hasDiscount && (
                            <span className="discount-badge-large">-{product.discountPercent}%</span>
                        )}
                    </div>
                </div>

                {/* Product Details */}
                <div className="product-info">
                    <h1 className="product-title">{product.productName}</h1>

                    <div className="product-meta">
                        <span className="vendor-name">
                            Sold by: <strong>{product.businessName}</strong>
                        </span>
                        <div className="product-rating-large">
                            {'★'.repeat(Math.floor(product.averageRating || 0))}
                            {'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                            <span>({product.reviewCount || 0} reviews)</span>
                        </div>
                    </div>

                    <div className="product-price-section">
                        {hasDiscount ? (
                            <>
                                <span className="original-price-large">${product.price.toFixed(2)}</span>
                                <span className="discounted-price-large">${discountedPrice.toFixed(2)}</span>
                                <span className="savings">You save: ${savings.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="price-large">${product.price.toFixed(2)}</span>
                        )}
                    </div>

                    <div className="product-stock">
                        {product.stockQuantity > 0 ? (
                            <span className="in-stock">✓ In Stock ({product.stockQuantity} available)</span>
                        ) : (
                            <span className="out-of-stock">✗ Out of Stock</span>
                        )}
                    </div>

                    {product.sku && (
                        <div className="product-sku">
                            SKU: {product.sku}
                        </div>
                    )}

                    <div className="product-description">
                        <h3>Description</h3>
                        <p>{product.description || 'No description available.'}</p>
                    </div>

                    {product.stockQuantity > 0 && (
                        <div className="purchase-section">
                            <div className="quantity-selector">
                                <label>Quantity:</label>
                                <div className="quantity-controls">
                                    <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        min="1"
                                        max={product.stockQuantity}
                                    />
                                    <button onClick={incrementQuantity} disabled={quantity >= product.stockQuantity}>+</button>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="add-to-cart-btn-large"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                >
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button
                                    className="buy-now-btn"
                                    onClick={handleBuyNow}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <h2>Customer Reviews</h2>
                {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
                ) : (
                    <div className="reviews-list">
                        {reviews.map(review => (
                            <div key={review.reviewId} className="review-card">
                                <div className="review-header">
                                    <span className="reviewer-name">{review.customerName}</span>
                                    <div className="review-rating">
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </div>
                                    <span className="review-date">
                                        {new Date(review.createdDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="review-comment">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="related-products">
                    <h2>You May Also Like</h2>
                    <div className="related-grid">
                        {relatedProducts.map(related => (
                            <div
                                key={related.productId}
                                className="related-card"
                                onClick={() => navigate(`/product/${related.productId}`)}
                            >
                                <div className="related-image">
                                    {related.imageUrl ? (
                                        <img src={related.imageUrl} alt={related.productName} />
                                    ) : (
                                        <div className="no-image-small">No Image</div>
                                    )}
                                </div>
                                <h4>{related.productName}</h4>
                                <p className="related-price">${related.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetail;