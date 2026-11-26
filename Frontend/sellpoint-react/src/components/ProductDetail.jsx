// src/components/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import styles from './ProductDetail.module.css';
import { addToCart } from '../services/cartHelper';
import { IS_DEMO_MODE } from '../config/appConfig';
import { DemoWishlistButton } from '../demo/DemoWishlistPages';

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
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const selectedVariant = product?.variants?.find(item => String(item.variantId) === String(selectedVariantId)) || product?.variants?.[0] || null;
    const availableStock = selectedVariant ? Number(selectedVariant.stockQuantity) : Number(product?.stockQuantity || 0);
    const displayedPrice = Number(selectedVariant?.price ?? product?.price ?? 0);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        setError('');

        try {
            const productData = await catalogService.getProductById(id);
            if (!productData) {
                setError('Product not found');
                return;
            }
            setProduct(productData);

            // Fetch related products from same category
            if (productData.categoryId) {
                fetchRelatedProducts(productData.categoryId, productData.productId);
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
            const reviewData = await catalogService.getProductReviews(id);
            setReviews(reviewData);
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        }
    };

    const fetchRelatedProducts = async (categoryId, currentProductId) => {
        try {
            const result = await catalogService.listProducts({
                categoryId,
                pageSize: 5,
                pageNumber: 1
            });
            // Filter out current product
            const related = (result.products || []).filter(p => p.productId !== currentProductId);
            setRelatedProducts(related.slice(0, 4));
        } catch (err) {
            console.error('Failed to fetch related products', err);
        }
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= availableStock) {
            setQuantity(value);
        }
    };

    const incrementQuantity = () => {
        if (quantity < availableStock) {
            setQuantity(quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            await addToCart(product, quantity, selectedVariant);
            alert(`${quantity} × ${product.productName} added to cart!`);
            return true;
        } catch (err) {
            console.error('Failed to add to cart', err);
            alert(err.message || 'Failed to add to cart. Please try again.');
            return false;
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        const added = await handleAddToCart();
        if (!added) return;
        if (IS_DEMO_MODE) {
            navigate('/cart');
        } else if (!localStorage.getItem('token')) {
            // Guest → send them to login, then they can go to cart
            navigate('/login', { state: { from: 'checkout' } });
        } else {
            navigate('/cart');
        }
    };

    const discountedPrice = displayedPrice * (1 - (product?.discountPercent || 0) / 100);
    const hasDiscount = (product?.discountPercent || 0) > 0;
    const savings = displayedPrice - discountedPrice;

    if (loading) {
        return (
            <div className={styles['product-detail-container']}>
                <div className={styles['loading-state']}>
                    <div className={styles['spinner']}></div>
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles['product-detail-container']}>
                <div className={styles['error-state']}>
                    <p>{error || 'Product not found'}</p>
                    <button onClick={() => navigate('/products')}>Back to Shop</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['product-detail-container']}>
            {/* Header */}
            <div className={styles['detail-header']}>
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className={styles['header-links']}>
                    <span onClick={() => navigate('/products')}>Continue Shopping</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                    <span onClick={() => navigate(IS_DEMO_MODE ? '/demo/workspace' : '/dashboard')}>My Account</span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className={styles['breadcrumb']}>
                <span onClick={() => navigate('/products')}>Home</span>
                <span>&gt;</span>
                <span onClick={() => navigate(`/products?category=${product.categoryId}`)}>
                    {product.categoryName}
                </span>
                <span>&gt;</span>
                <span className={styles['current']}>{product.productName}</span>
            </div>

            {/* Product Main Info */}
            <div className={styles['product-main']}>
                {/* Product Images */}
                <div className={styles['product-gallery']}>
                    <div className={styles['main-image']}>
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} />
                        ) : (
                            <div className={styles['no-image-large']}>No Image Available</div>
                        )}
                        {hasDiscount && (
                            <span className={styles['discount-badge-large']}>-{product.discountPercent}%</span>
                        )}
                    </div>
                </div>

                {/* Product Details */}
                <div className={styles['product-info']}>
                    <div className="demo-product-title-row"><h1 className={styles['product-title']}>{product.productName}</h1>{IS_DEMO_MODE && <DemoWishlistButton product={product} />}</div>

                    <div className={styles['product-meta']}>
                        <span className={styles['vendor-name']}>
                            Sold by: <strong>{product.businessName}</strong>
                        </span>
                        <div className={styles['product-rating-large']}>
                            {'★'.repeat(Math.floor(product.averageRating || 0))}
                            {'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                            <span>({product.reviewCount || 0} reviews)</span>
                        </div>
                    </div>

                    <div className={styles['product-price-section']}>
                        {hasDiscount ? (
                            <>
                                <span className={styles['original-price-large']}>${product.price.toFixed(2)}</span>
                                <span className={styles['discounted-price-large']}>${discountedPrice.toFixed(2)}</span>
                                <span className={styles['savings']}>You save: ${savings.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className={styles['price-large']}>${product.price.toFixed(2)}</span>
                        )}
                    </div>

                    {IS_DEMO_MODE && Array.isArray(product.variants) && product.variants.length > 0 && <div className="demo-variant-selector">
                        <label htmlFor="demo-product-variant">Choose an option</label>
                        <select id="demo-product-variant" value={selectedVariant?.variantId || ''} onChange={event => { setSelectedVariantId(event.target.value); setQuantity(1); }}>
                            {product.variants.map(variant => <option key={variant.variantId} value={variant.variantId} disabled={Number(variant.stockQuantity) <= 0}>{variant.variantName} — {Number(variant.stockQuantity)} available</option>)}
                        </select>
                    </div>}
                    <div className={styles['product-stock']}>
                        {availableStock > 0 ? (
                            <span className={styles['in-stock']}>✓ In Stock ({availableStock} available)</span>
                        ) : (
                            <span className={styles['out-of-stock']}>✗ Out of Stock</span>
                        )}
                    </div>

                    {product.sku && (
                        <div className={styles['product-sku']}>
                            SKU: {product.sku}
                        </div>
                    )}

                    <div className={styles['product-description']}>
                        <h3>Description</h3>
                        <p>{product.description || 'No description available.'}</p>
                    </div>

                    {availableStock > 0 && (
                        <div className={styles['purchase-section']}>
                            <div className={styles['quantity-selector']}>
                                <label>Quantity:</label>
                                <div className={styles['quantity-controls']}>
                                    <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        min="1"
                                        max={availableStock}
                                    />
                                    <button onClick={incrementQuantity} disabled={quantity >= availableStock}>+</button>
                                </div>
                            </div>

                            <div className={styles['action-buttons']}>
                                <button
                                    className={styles['add-to-cart-btn-large']}
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                >
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button
                                    className={styles['buy-now-btn']}
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
            <div className={styles['reviews-section']}>
                <h2>Customer Reviews</h2>
                {reviews.length === 0 ? (
                    <p className={styles['no-reviews']}>No reviews yet. Be the first to review this product!</p>
                ) : (
                    <div className={styles['reviews-list']}>
                        {reviews.map(review => (
                            <div key={review.reviewId} className={styles['review-card']}>
                                <div className={styles['review-header']}>
                                    <span className={styles['reviewer-name']}>{review.customerName}</span>
                                    <div className={styles['review-rating']}>
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </div>
                                    <span className={styles['review-date']}>
                                        {new Date(review.createdDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={styles['review-comment']}>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className={styles['related-products']}>
                    <h2>You May Also Like</h2>
                    <div className={styles['related-grid']}>
                        {relatedProducts.map(related => (
                            <div
                                key={related.productId}
                                className={styles['related-card']}
                                onClick={() => navigate(`/product/${related.productId}`)}
                            >
                                <div className={styles['related-image']}>
                                    {related.imageUrl ? (
                                        <img src={related.imageUrl} alt={related.productName} />
                                    ) : (
                                        <div className={styles['no-image-small']}>No Image</div>
                                    )}
                                </div>
                                <h4>{related.productName}</h4>
                                <p className={styles['related-price']}>${related.price.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetail;