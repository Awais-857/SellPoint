// src/components/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Checkout.css';

function Checkout() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [error, setError] = useState('');
    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        vendorCount: 0
    });

    // New Address Form
    const [newAddress, setNewAddress] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan',
        isDefault: false
    });

    // Payment Method
    const [paymentMethod, setPaymentMethod] = useState('cashondelivery'); // cashondelivery, creditcard
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCheckoutData();
    }, []);

    const fetchCheckoutData = async () => {
    setLoading(true);
    setError('');

    try {
        // Fetch cart items
        const cartResponse = await api.get('/cart');
        const items = cartResponse.data.items || [];

        if (items.length === 0) {
            navigate('/cart');
            return;
        }

        setCartItems(items);

        // Fetch cart summary - map backend fields to frontend expectations
        const summaryResponse = await api.get('/cart/summary');
        const summary = summaryResponse.data;
        
        setCartSummary({
            subtotal: summary.subtotal || 0,
            shipping: summary.estimatedShipping || 0,
            tax: summary.estimatedTax || 0,
            total: (summary.subtotal || 0) + (summary.estimatedShipping || 0) + (summary.estimatedTax || 0),
            itemCount: summary.itemCount || 0,
            vendorCount: summary.vendorCount || 0
        });

        // Fetch user addresses
        const addressResponse = await api.get('/addresses');
        const userAddresses = addressResponse.data || [];
        setAddresses(userAddresses);

        // Auto-select default address
        const defaultAddr = userAddresses.find(a => a.isDefault);
        if (defaultAddr) {
            setSelectedAddressId(defaultAddr.addressId);
        }
    } catch (err) {
        console.error('Failed to fetch checkout data', err);
        setError('Failed to load checkout information. Please try again.');
    } finally {
        setLoading(false);
    }
};

    const handleAddAddress = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/addresses', newAddress);
            const newAddressId = response.data.addressId;

            // Refresh addresses list
            const addressResponse = await api.get('/addresses');
            setAddresses(addressResponse.data);
            setSelectedAddressId(newAddressId);
            setShowAddressForm(false);

            // Reset form
            setNewAddress({
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'Pakistan',
                isDefault: false
            });
        } catch (err) {
            console.error('Failed to add address', err);
            alert('Failed to add address. Please try again.');
        }
    };

    const handleAddressChange = (addressId) => {
        setSelectedAddressId(addressId);
    };

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;

        // Format card number with spaces
        if (name === 'cardNumber') {
            let cleaned = value.replace(/\s/g, '');
            if (cleaned.length > 16) cleaned = cleaned.slice(0, 16);
            let formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
            setCardDetails(prev => ({ ...prev, [name]: formatted }));
            return;
        }

        // Limit CVV to 3-4 digits
        if (name === 'cvv') {
            if (value.length > 4) return;
            setCardDetails(prev => ({ ...prev, [name]: value }));
            return;
        }

        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const validateCardDetails = () => {
        if (paymentMethod !== 'creditcard') return true;

        const cardNumberClean = cardDetails.cardNumber.replace(/\s/g, '');
        if (cardNumberClean.length < 16) {
            alert('Please enter a valid 16-digit card number');
            return false;
        }

        if (!cardDetails.cardName.trim()) {
            alert('Please enter the name on card');
            return false;
        }

        const expiryMonth = parseInt(cardDetails.expiryMonth);
        const expiryYear = parseInt(cardDetails.expiryYear);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;

        if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
            alert('Card has expired');
            return false;
        }

        if (cardDetails.cvv.length < 3) {
            alert('Please enter a valid CVV');
            return false;
        }

        return true;
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            return;
        }

        if (!validateCardDetails()) {
            return;
        }

        if (!window.confirm('Confirm your order? You will not be able to change it after placing.')) {
            return;
        }

        setPlacingOrder(true);
        setError('');

        try {
            const orderData = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod === 'creditcard' ? 'CreditCard' : 'CashOnDelivery',
                cardDetails: paymentMethod === 'creditcard' ? cardDetails : null,
                subtotal: cartSummary.subtotal,
                shippingCost: cartSummary.shipping,
                taxAmount: cartSummary.tax,
                discountAmount: 0,
                totalAmount: cartSummary.total,
                notes: ''
            };

            const response = await api.post('/orders', orderData);
            const orderId = response.data.orderId;

            // Clear cart after successful order
            await api.delete('/cart/clear');

            alert('Order placed successfully!');
            navigate(`/order-confirmation/${orderId}`);
        } catch (err) {
            console.error('Failed to place order', err);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    // Group items by vendor
    const groupedItems = cartItems.reduce((groups, item) => {
        const vendorKey = item.vendorId || item.vendorName;
        if (!groups[vendorKey]) {
            groups[vendorKey] = {
                vendorName: item.vendorName,
                items: []
            };
        }
        groups[vendorKey].items.push(item);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="checkout-container">
                <div className="checkout-header">
                    <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                    <span onClick={() => navigate('/cart')}>Back to Cart</span>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading checkout...</p>
                </div>
            </div>
        );
    }

    const selectedAddress = addresses.find(a => a.addressId === selectedAddressId);

    return (
        <div className="checkout-container">
            {/* Header */}
            <div className="checkout-header">
                <h1 onClick={() => navigate('/products')}>SellPoint</h1>
                <div className="header-steps">
                    <span className="step completed">Cart</span>
                    <span className="step-separator">→</span>
                    <span className="step active">Checkout</span>
                    <span className="step-separator">→</span>
                    <span className="step">Confirmation</span>
                </div>
                <span onClick={() => navigate('/cart')} className="back-link">Back to Cart</span>
            </div>

            <div className="checkout-main">
                {error && (
                    <div className="checkout-error">
                        <p>{error}</p>
                    </div>
                )}

                <div className="checkout-content">
                    {/* Left Column - Shipping & Payment */}
                    <div className="checkout-left">
                        {/* Shipping Address Section */}
                        <div className="section">
    <h2>1. Shipping Address</h2>

    {/* Show saved addresses if any */}
    {addresses.length > 0 && !showAddressForm && (
        <div className="address-list">
            {addresses.map(address => (
                <div
                    key={address.addressId}
                    className={`address-card ${selectedAddressId === address.addressId ? 'selected' : ''}`}
                    onClick={() => handleAddressChange(address.addressId)}
                >
                    <input
                        type="radio"
                        checked={selectedAddressId === address.addressId}
                        onChange={() => handleAddressChange(address.addressId)}
                    />
                    <div className="address-details">
                        <p className="address-line">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="address-line">
                            {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="address-line">{address.country}</p>
                        {address.isDefault && (
                            <span className="default-badge">Default</span>
                        )}
                    </div>
                </div>
            ))}
            <button
                className="add-address-btn"
                onClick={() => setShowAddressForm(true)}
            >
                + Add New Address
            </button>
        </div>
    )}

    {/* If no saved addresses and form is not shown, prompt to add */}
    {addresses.length === 0 && !showAddressForm && (
        <div className="empty-address-state" style={{ textAlign: 'center', padding: '20px' }}>
            <p>You haven't saved any addresses yet.</p>
            <button
                className="add-address-btn"
                onClick={() => setShowAddressForm(true)}
            >
                + Add Shipping Address
            </button>
        </div>
    )}

    {/* Address form (shared for add and edit) */}
    {showAddressForm && (
        <form onSubmit={handleAddAddress} className="address-form">
            <h3>{addresses.length === 0 ? 'Add Your Address' : 'New Address'}</h3>
            <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                    type="text"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input
                    type="text"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>City *</label>
                    <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>State *</label>
                    <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>ZIP Code *</label>
                    <input
                        type="text"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Country</label>
                    <input
                        type="text"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    />
                </div>
            </div>
            <div className="form-group checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    />
                    Set as default address
                </label>
            </div>
            <div className="form-actions">
                <button type="button" onClick={() => setShowAddressForm(false)} className="cancel-btn">
                    Cancel
                </button>
                <button type="submit" className="save-btn">
                    Save Address
                </button>
            </div>
        </form>
    )}
</div>

                        {/* Payment Method Section */}
                        <div className="section">
                            <h2>2. Payment Method</h2>

                            <div className="payment-methods">
                                <div
                                    className={`payment-option ${paymentMethod === 'cashondelivery' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('cashondelivery')}
                                >
                                    <input
                                        type="radio"
                                        checked={paymentMethod === 'cashondelivery'}
                                        onChange={() => setPaymentMethod('cashondelivery')}
                                    />
                                    <div className="payment-info">
                                        <span className="payment-icon">💵</span>
                                        <div>
                                            <strong>Cash on Delivery</strong>
                                            <p>Pay when you receive your order</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`payment-option ${paymentMethod === 'creditcard' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('creditcard')}
                                >
                                    <input
                                        type="radio"
                                        checked={paymentMethod === 'creditcard'}
                                        onChange={() => setPaymentMethod('creditcard')}
                                    />
                                    <div className="payment-info">
                                        <span className="payment-icon">💳</span>
                                        <div>
                                            <strong>Credit / Debit Card</strong>
                                            <p>Pay securely with your card</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'creditcard' && (
                                <div className="card-details-form">
                                    <h3>Card Details</h3>
                                    <div className="form-group">
                                        <label>Card Number</label>
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            value={cardDetails.cardNumber}
                                            onChange={handleCardInputChange}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength="19"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Name on Card</label>
                                        <input
                                            type="text"
                                            name="cardName"
                                            value={cardDetails.cardName}
                                            onChange={handleCardInputChange}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Expiry Month</label>
                                            <select
                                                name="expiryMonth"
                                                value={cardDetails.expiryMonth}
                                                onChange={handleCardInputChange}
                                                required
                                            >
                                                <option value="">Month</option>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Expiry Year</label>
                                            <select
                                                name="expiryYear"
                                                value={cardDetails.expiryYear}
                                                onChange={handleCardInputChange}
                                                required
                                            >
                                                <option value="">Year</option>
                                                {Array.from({ length: 10 }, (_, i) => {
                                                    const year = new Date().getFullYear() + i;
                                                    return <option key={year} value={year % 100}>{year}</option>;
                                                })}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>CVV</label>
                                            <input
                                                type="password"
                                                name="cvv"
                                                value={cardDetails.cvv}
                                                onChange={handleCardInputChange}
                                                placeholder="123"
                                                maxLength="4"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <p className="secure-note">🔒 Your payment information is secure and encrypted</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="checkout-right">
                        <div className="order-summary-card">
                            <h3>Order Summary</h3>

                            <div className="order-items-preview">
                                {Object.values(groupedItems).map((group, idx) => (
                                    <div key={idx} className="vendor-summary">
                                        <div className="vendor-name">{group.vendorName}</div>
                                        {group.items.map(item => (
                                            <div key={item.cartId} className="order-item">
                                                <span className="item-name">
                                                    {item.quantity} × {item.productName}
                                                </span>
                                                <span className="item-price">
                                                    ${item.itemTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-row">
                                <span>Subtotal ({cartSummary.itemCount} items)</span>
                                <span>${cartSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping ({cartSummary.vendorCount} vendors)</span>
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

                            <div className="shipping-info">
                                <p>📦 Estimated Delivery</p>
                                <small>5-7 business days after order confirmation</small>
                            </div>

                            <button
                                className="place-order-btn"
                                onClick={handlePlaceOrder}
                                disabled={placingOrder || !selectedAddressId}
                            >
                                {placingOrder ? 'Placing Order...' : `Place Order • $${cartSummary.total.toFixed(2)}`}
                            </button>

                            <p className="order-note">
                                By placing your order, you agree to our Terms and Conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;