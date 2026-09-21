// src/components/ProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProductListing.module.css';

function ProductCard({ product, onAddToCart }) {
    const navigate = useNavigate();
    const discountedPrice = product.price * (1 - (product.discountPercent || 0) / 100);
    const hasDiscount = product.discountPercent > 0;

    return (
        <div className={styles['product-card']}>
            <div
                className={styles['product-card-image']}
                onClick={() => navigate(`/product/${product.productId}`)}
            >
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.productName} />
                ) : (
                    <div className={styles['no-image']}>No Image</div>
                )}
                {hasDiscount && (
                    <span className={styles['discount-badge']}>-{product.discountPercent}%</span>
                )}
            </div>

            <div className={styles['product-card-info']}>
                <h3
                    onClick={() => navigate(`/product/${product.productId}`)}
                    className={styles['product-name']}
                >
                    {product.productName}
                </h3>

                <p className={styles['product-vendor']}>{product.businessName}</p>

                <div className={styles['product-rating']}>
                    {'★'.repeat(Math.floor(product.averageRating || 0))}
                    {'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                    <span>({product.reviewCount || 0})</span>
                </div>

                <div className={styles['product-price']}>
                    {hasDiscount ? (
                        <>
                            <span className={styles['original-price']}>${product.price.toFixed(2)}</span>
                            <span className={styles['discounted-price']}>${discountedPrice.toFixed(2)}</span>
                        </>
                    ) : (
                        <span className={styles['price']}>${product.price.toFixed(2)}</span>
                    )}
                </div>

                <button
                    className={styles['add-to-cart-btn']}
                    onClick={() => onAddToCart(product)}
                    disabled={product.stockQuantity === 0}
                >
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;