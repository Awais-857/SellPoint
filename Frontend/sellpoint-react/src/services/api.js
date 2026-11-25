// src/services/api.js
import axios from 'axios';
import { API_BASE_URL, IS_DEMO_MODE } from '../config/appConfig';

// The API client is retained for the existing full-stack application.
// In Demo Mode, its request interceptor rejects every request before Axios
// can send anything to a backend.
const api = axios.create({
    baseURL: API_BASE_URL || undefined
});

// ---------- Slow-request tracking ----------
let activeRequests = 0;
let slowTimer = null;

const markSlow = () => {
    if (slowTimer) return;
    slowTimer = setTimeout(() => {
        window.dispatchEvent(new Event('server-slow-start'));
    }, 3000); // fire after 3 seconds of waiting
};

const clearSlowIfIdle = () => {
    if (activeRequests === 0 && slowTimer) {
        clearTimeout(slowTimer);
        slowTimer = null;
        window.dispatchEvent(new Event('server-slow-end'));
    }
};

// ---------- Request interceptor ----------
api.interceptors.request.use(
    config => {
        if (IS_DEMO_MODE) {
            return Promise.reject(
                new Error('Backend requests are disabled in Demo Mode.')
            );
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        activeRequests += 1;
        markSlow();
        return config;
    },
    error => Promise.reject(error)
);

// ---------- Response interceptor ----------
api.interceptors.response.use(
    response => {
        activeRequests = Math.max(0, activeRequests - 1);
        clearSlowIfIdle();
        return response;
    },
    error => {
        // A Demo Mode request is rejected before activeRequests is incremented.
        if (!IS_DEMO_MODE) {
            activeRequests = Math.max(0, activeRequests - 1);
            clearSlowIfIdle();
        }
        return Promise.reject(error);
    }
);

export default api;

// Optional grouped API exports (kept as-is)
export const productAPI = {
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
    getProductsByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
    searchProducts: (searchTerm) => api.get('/products/search', { params: { q: searchTerm } })
};

export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`)
};

export const cartAPI = {
    getCart: () => api.get('/cart'),
    addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
    updateQuantity: (cartId, quantity) => api.put(`/cart/${cartId}`, { quantity }),
    removeFromCart: (cartId) => api.delete(`/cart/${cartId}`),
    clearCart: () => api.delete('/cart/clear')
};
