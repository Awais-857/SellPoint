// src/components/Cart.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    isLoggedIn,
    getCart,
    updateQuantity,
    removeItem,
    clearCart
} from '../services/cartHelper';
import styles from './Cart.module.css';

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

    const loggedIn = isLoggedIn();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        setLoading(true);
        setError('');
        try {
            const items = await getCart();
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
        const uniqueVendors = new Set(items.map(item => item.vendorId || item.vendorName));
        const shipping = uniqueVendors.size * 5;
        const tax = subtotal * 0.10;
        const total = subtotal + shipping + tax;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartSummary({ subtotal, shipping, tax, total, itemCount });
    };

    const handleUpdateQuantity = async (cartId, newQuantity) => {
        if (newQuantity < 1) {
            await handleRemoveItem(cartId);
            return;
        }
        setUpdating(true);
        try {
            await updateQuantity(cartId, newQuantity);
            await fetchCart();
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
            await removeItem(cartId);
            await fetchCart();
        } catch (err) {
            console.error('Failed to remove item', err);
            alert('Failed to remove item. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
        setUpdating(true);
        try {
            await clearCart();
            await fetchCart();
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
        if (!loggedIn) {
            alert('Please log in to proceed with checkout.');
            navigate('/login', { state: { from: 'checkout' } });
            return;
        }
        navigate('/checkout');
    };

    const handleContinueShopping = () => navigate('/products');

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
            <div className={styles['cart-container']}>
                <div className={styles['cart-header']}>
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <div className={styles['header-links']}>
                        <span onClick={() => navigate('/products')}>Continue Shopping</span>
                        {loggedIn
                            ? <span onClick={() => navigate('/dashboard')}>My Account</span>
                            : <span onClick={() => navigate('/login')}>Login</span>}
                    </div>
                </div>
                <div className={styles['loading-state']}>
                    <div className={styles['spinner']}></div>
                    <p>Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['cart-container']}>
            <div className={styles['cart-header']}>
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className={styles['header-links']}>
                    <span onClick={handleContinueShopping}>Continue Shopping</span>
                    {loggedIn
                        ? <span onClick={() => navigate('/dashboard')}>My Account</span>
                        : <span onClick={() => navigate('/login')}>Login</span>}
                </div>
            </div>

            <div className={styles['cart-main']}>
                <h2>Shopping Cart</h2>

                {!loggedIn && cartItems.length > 0 && (
                    <div className={styles['guest-banner']} style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        marginBottom: '16px'
                    }}>
                        You're browsing as a guest. Your cart will be saved, but you'll need to
                        <a href="/login" style={{ marginLeft: 4, color: '#856404', fontWeight: 600 }}>
                            log in to check out
                        </a>.
                    </div>
                )}

                {error && (
                    <div className={styles['cart-error']}>
                        <p>{error}</p>
                        <button onClick={fetchCart}>Retry</button>
                    </div>
                )}

                {cartItems.length === 0 && !error ? (
                    <div className={styles['empty-cart']}>
                        <div className={styles['empty-cart-icon']}>🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added any items to your cart yet.</p>
                        <button onClick={handleContinueShopping} className={styles['shop-now-btn']}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className={styles['cart-content']}>
                        <div className={styles['cart-items-section']}>
                            {Object.values(groupedItems).map((group, idx) => (
                                <div key={idx} className={styles['vendor-group']}>
                                    <div className={styles['items-list']}>
                                        <div className={styles['items-header']}>
                                            <span className={styles['col-product']}>Product</span>
                                            <span className={styles['col-price']}>Price</span>
                                            <span className={styles['col-quantity']}>Quantity</span>
                                            <span className={styles['col-total']}>Total</span>
                                            <span className={styles['col-action']}></span>
                                        </div>
                                        {group.items.map(item => (
                                            <div key={item.cartId} className={styles['cart-item']}>
                                                <div className={styles['item-product']}>
                                                    <div
                                                        className={styles['item-image']}
                                                        onClick={() => navigate(`/product/${item.productId}`)}
                                                    >
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.productName} />
                                                        ) : (
                                                            <div className={styles['no-image']}>No Image</div>
                                                        )}
                                                    </div>
                                                    <div className={styles['item-details']}>
                                                        <h4
                                                            className={styles['item-name']}
                                                            onClick={() => navigate(`/product/${item.productId}`)}
                                                        >
                                                            {item.productName}
                                                        </h4>
                                                        {item.categoryName && (
                                                            <p className={styles['item-category']}>{item.categoryName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles['item-price']}>
                                                    ${item.price.toFixed(2)}
                                                </div>
                                                <div className={styles['item-quantity']}>
                                                    <div className={styles['quantity-controls']}>
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
                                                        <span className={styles['stock-warning']}>Max stock reached</span>
                                                    )}
                                                </div>
                                                <div className={styles['item-total']}>
                                                    ${item.itemTotal.toFixed(2)}
                                                </div>
                                                <div className={styles['item-action']}>
                                                    <button
                                                        className={styles['remove-btn']}
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

                            {cartItems.length > 0 && (
                                <div className={styles['clear-cart-section']}>
                                    <button onClick={handleClearCart} className={styles['clear-cart-btn']} disabled={updating}>
                                        Clear Cart
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={styles['order-summary']}>
                            <h3>Order Summary</h3>
                            <div className={styles['summary-row']}>
                                <span>Subtotal ({cartSummary.itemCount} items)</span>
                                <span>${cartSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className={styles['summary-row']}>
                                <span>Shipping</span>
                                <span>${cartSummary.shipping.toFixed(2)}</span>
                            </div>
                            <div className={styles['summary-row']}>
                                <span>Tax (10%)</span>
                                <span>${cartSummary.tax.toFixed(2)}</span>
                            </div>
                            <div className={styles['summary-row'] + ' ' + styles['total']}>
                                <span>Total</span>
                                <span>${cartSummary.total.toFixed(2)}</span>
                            </div>
                            <button
                                className={styles['checkout-btn']}
                                onClick={handleProceedToCheckout}
                                disabled={updating || cartItems.length === 0}
                            >
                                {loggedIn ? 'Proceed to Checkout' : 'Log in to Checkout'}
                            </button>
                            <button
                                className={styles['continue-shopping-btn']}
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