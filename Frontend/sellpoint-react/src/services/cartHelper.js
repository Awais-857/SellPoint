// src/services/cartHelper.js
import api from './api';

const GUEST_CART_KEY = 'guestCart';

export const isLoggedIn = () => !!localStorage.getItem('token');

// ---------- Guest storage helpers ----------
const readGuestCart = () => {
    try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeGuestCart = (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    // Notify any listener (e.g. header badge, cart page)
    window.dispatchEvent(new Event('cartUpdated'));
};

const toGuestItem = (product, quantity) => {
    const discount = product.discountPercent || 0;
    const unitPrice = product.price * (1 - discount / 100);
    return {
        cartId: product.productId,               // guests use productId as identifier
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        discountPercent: discount,
        imageUrl: product.imageUrl || null,
        quantity,
        vendorName: product.businessName || product.vendorName || 'Unknown Vendor',
        vendorId: product.vendorId,
        stockQuantity: product.stockQuantity ?? 999,
        categoryName: product.categoryName || null,
        itemTotal: unitPrice * quantity
    };
};

const recalcItem = (item) => {
    const discount = item.discountPercent || 0;
    const unitPrice = item.price * (1 - discount / 100);
    item.itemTotal = unitPrice * item.quantity;
    return item;
};

// ---------- Public API ----------

export const getCart = async () => {
    if (isLoggedIn()) {
        const res = await api.get('/cart');
        return res.data.items || [];
    }
    return readGuestCart();
};

export const addToCart = async (product, quantity = 1) => {
    if (isLoggedIn()) {
        await api.post('/cart/add', { productId: product.productId, quantity });
        window.dispatchEvent(new Event('cartUpdated'));
        return;
    }

    const items = readGuestCart();
    const existing = items.find((i) => i.productId === product.productId);
    if (existing) {
        existing.quantity += quantity;   // (A) increment like Amazon
        recalcItem(existing);
    } else {
        items.push(toGuestItem(product, quantity));
    }
    writeGuestCart(items);
};

export const updateQuantity = async (cartIdOrProductId, newQuantity) => {
    if (isLoggedIn()) {
        if (newQuantity < 1) {
            await api.delete(`/cart/${cartIdOrProductId}`);
        } else {
            await api.put(`/cart/${cartIdOrProductId}`, { quantity: newQuantity });
        }
        window.dispatchEvent(new Event('cartUpdated'));
        return;
    }

    let items = readGuestCart();
    if (newQuantity < 1) {
        items = items.filter((i) => i.productId !== cartIdOrProductId);
    } else {
        const item = items.find((i) => i.productId === cartIdOrProductId);
        if (item) {
            item.quantity = newQuantity;
            recalcItem(item);
        }
    }
    writeGuestCart(items);
};

export const removeItem = async (cartIdOrProductId) => {
    if (isLoggedIn()) {
        await api.delete(`/cart/${cartIdOrProductId}`);
        window.dispatchEvent(new Event('cartUpdated'));
        return;
    }
    const items = readGuestCart().filter((i) => i.productId !== cartIdOrProductId);
    writeGuestCart(items);
};

export const clearCart = async () => {
    if (isLoggedIn()) {
        await api.delete('/cart/clear');
        window.dispatchEvent(new Event('cartUpdated'));
        return;
    }
    writeGuestCart([]);
};

export const getGuestCartCount = () => {
    return readGuestCart().reduce((sum, i) => sum + i.quantity, 0);
};

/**
 * Called right after a successful login.
 * Pushes each guest-cart item to the server, then clears localStorage.
 */
export const mergeGuestCartToServer = async () => {
    if (!isLoggedIn()) return;
    const items = readGuestCart();
    if (items.length === 0) return;

    try {
        for (const item of items) {
            await api.post('/cart/add', {
                productId: item.productId,
                quantity: item.quantity
            });
        }
        localStorage.removeItem(GUEST_CART_KEY);
        window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
        console.error('Failed to merge guest cart:', err);
        // Leave the guest cart in place so the user can retry later.
    }
};