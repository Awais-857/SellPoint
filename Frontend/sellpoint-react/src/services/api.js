// src/services/api.js
import axios from 'axios';

// Use environment variable for API base URL, fallback to localhost for development
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5274/api'
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

export default api;

// Optional grouped API exports (keep as is)
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