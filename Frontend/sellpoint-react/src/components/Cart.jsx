// src/components/Cart.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Cart.css';

function Cart() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0
    });

    useEffect(() => {
        checkAuthAndFetchCart();
    }, []);

    const checkAuthAndFetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        await fetchCart();
    };

    const fetchCart = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/cart');
            const items = response.data.items || [];
            setCartItems(items);
            calculateSummary(items);
        } catch (err) {
            console.error('Failed to fetch cart', err);
            setError('Failed to load cart. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (items) => {
        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
        // Calculate shipping: $5 per unique vendor
        const uniqueVendors = new Set(items.map(item => item.vendorId || item.vendorName));
        const shipping = uniqueVendors.size * 5;
        const tax = subtotal * 0.10; // 10% tax
        const total = subtotal + shipping + tax;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        setCartSummary({
            subtotal,
            shipping,
            tax,
            total,
            itemCount
        });
    };

    const handleUpdateQuantity = async (cartId, newQuantity) => {
        if (newQuantity < 1) {
            await handleRemoveItem(cartId);
            return;
        }

        setUpdating(true);
        try {
            await api.put(`/cart/${cartId}`, { quantity: newQuantity });
            await fetchCart(); // Refresh cart
        } catch (err) {
            console.error('Failed to update quantity', err);
            alert('Failed to update quantity. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveItem = async (cartId) => {
        setUpdating(true);
        try {
            await api.delete(`/cart/${cartId}`);
            await fetchCart(); // Refresh cart
        } catch (err) {
            console.error('Failed to remove item', err);
            alert('Failed to remove item. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your entire cart?')) {
            return;
        }

        setUpdating(true);
        try {
            await api.delete('/cart/clear');
            await fetchCart(); // Refresh cart
        } catch (err) {
            console.error('Failed to clear cart', err);
            alert('Failed to clear cart. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleProceedToCheckout = () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        navigate('/products');
    };

    // Group items by vendor for display
    const groupedItems = cartItems.reduce((groups, item) => {
        const vendorKey = item.vendorId || item.vendorName;
        if (!groups[vendorKey]) {
            groups[vendorKey] = {
                vendorName: item.vendorName,
                vendorId: item.vendorId,
                items: []
            };
        }
        groups[vendorKey].items.push(item);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="cart-container">
                <div className="cart-header">
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <div className="header-links">
                        <span onClick={() => navigate('/products')}>Continue Shopping</span>
                        <span onClick={() => navigate('/dashboard')}>My Account</span>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            {/* Header */}
            <div className="cart-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-links">
                    <span onClick={handleContinueShopping}>Continue Shopping</span>
                    <span onClick={() => navigate('/dashboard')}>My Account</span>
                </div>
            </div>

            <div className="cart-main">
                <h2>Shopping Cart</h2>

                {error && (
                    <div className="cart-error">
                        <p>{error}</p>
                        <button onClick={fetchCart}>Retry</button>
                    </div>
                )}

                {cartItems.length === 0 && !error ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added any items to your cart yet.</p>
                        <button onClick={handleContinueShopping} className="shop-now-btn">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="cart-content">
                        {/* Cart Items */}
                        <div className="cart-items-section">
                            {Object.values(groupedItems).map((group, idx) => (
                                <div key={idx} className="vendor-group">
                                    <div className="vendor-header">
                                        <h3>{group.vendorName}</h3>
                                    </div>
                                    <div className="items-list">
                                        <div className="items-header">
                                            <span className="col-product">Product</span>
                                            <span className="col-price">Price</span>
                                            <span className="col-quantity">Quantity</span>
                                            <span className="col-total">Total</span>
                                            <span className="col-action"></span>
                                        </div>
                                        {group.items.map(item => (
                                            <div key={item.cartId} className="cart-item">
                                                <div className="item-product">
                                                    <div
                                                        className="item-image"
                                                        onClick={() => navigate(`/product/${item.productId}`)}
                                                    >
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.productName} />
                                                        ) : (
                                                            <div className="no-image">No Image</div>
                                                        )}
                                                    </div>
                                                    <div className="item-details">
                                                        <h4
                                                            className="item-name"
                                                            onClick={() => navigate(`/product/${item.productId}`)}
                                                        >
                                                            {item.productName}
                                                        </h4>
                                                        {item.categoryName && (
                                                            <p className="item-category">{item.categoryName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="item-price">
                                                    ${item.price.toFixed(2)}
                                                </div>
                                                <div className="item-quantity">
                                                    <div className="quantity-controls">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.cartId, item.quantity - 1)}
                                                            disabled={updating}
                                                        >
                                                            -
                                                        </button>
                                                        <span>{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.cartId, item.quantity + 1)}
                                                            disabled={updating || item.quantity >= item.stockQuantity}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    {item.stockQuantity && item.quantity >= item.stockQuantity && (
                                                        <span className="stock-warning">Max stock reached</span>
                                                    )}
                                                </div>
                                                <div className="item-total">
                                                    ${item.itemTotal.toFixed(2)}
                                                </div>
                                                <div className="item-action">
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveItem(item.cartId)}
                                                        disabled={updating}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Clear Cart Button */}
                            {cartItems.length > 0 && (
                                <div className="clear-cart-section">
                                    <button onClick={handleClearCart} className="clear-cart-btn" disabled={updating}>
                                        Clear Cart
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="order-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal ({cartSummary.itemCount} items)</span>
                                <span>${cartSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>${cartSummary.shipping.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax (10%)</span>
                                <span>${cartSummary.tax.toFixed(2)}</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${cartSummary.total.toFixed(2)}</span>
                            </div>
                            <button
                                className="checkout-btn"
                                onClick={handleProceedToCheckout}
                                disabled={updating || cartItems.length === 0}
                            >
                                Proceed to Checkout
                            </button>
                            <button
                                className="continue-shopping-btn"
                                onClick={handleContinueShopping}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;