// src/components/ProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProductCard({ product, onAddToCart }) {
    const navigate = useNavigate();

    const discountedPrice = product.price * (1 - (product.discountPercent || 0) / 100);
    const hasDiscount = product.discountPercent > 0;

    return (
        <div className="product-card">
            <div
                className="product-card-image"
                onClick={() => navigate(`/product/${product.productId}`)}
            >
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.productName} />
                ) : (
                    <div className="no-image">No Image</div>
                )}
                {hasDiscount && (
                    <span className="discount-badge">-{product.discountPercent}%</span>
                )}
            </div>

            <div className="product-card-info">
                <h3
                    onClick={() => navigate(`/product/${product.productId}`)}
                    className="product-name"
                >
                    {product.productName}
                </h3>

                <p className="product-vendor">{product.businessName}</p>

                <div className="product-rating">
                    {'★'.repeat(Math.floor(product.averageRating || 0))}
                    {'☆'.repeat(5 - Math.floor(product.averageRating || 0))}
                    <span>({product.reviewCount || 0})</span>
                </div>

                <div className="product-price">
                    {hasDiscount ? (
                        <>
                            <span className="original-price">${product.price.toFixed(2)}</span>
                            <span className="discounted-price">${discountedPrice.toFixed(2)}</span>
                        </>
                    ) : (
                        <span className="price">${product.price.toFixed(2)}</span>
                    )}
                </div>

                <button
                    className="add-to-cart-btn"
                    onClick={() => onAddToCart(product.productId)}
                    disabled={product.stockQuantity === 0}
                >
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;