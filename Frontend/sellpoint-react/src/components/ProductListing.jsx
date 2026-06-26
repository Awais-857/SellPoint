// src/components/ProductListing.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProductCard from './ProductCard';
import './ProductListing.css';

function ProductListing() {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('CreatedDate');
    const [sortOrder, setSortOrder] = useState('DESC');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const pageSize = 12;

    // Parse URL query params on load
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }
    }, [location]);

    // Fetch categories on load
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch products when filters change
    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, searchTerm, minPrice, maxPrice, sortBy, sortOrder, currentPage]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/products', {
                params: {
                    categoryId: selectedCategory || undefined,
                    searchTerm: searchTerm || undefined,
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                    sortBy: sortBy,
                    sortOrder: sortOrder,
                    pageNumber: currentPage,
                    pageSize: pageSize
                }
            });

            setProducts(response.data.products || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalProducts(response.data.totalCount || 0);
        } catch (err) {
            console.error('Failed to fetch products', err);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts();
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setCurrentPage(1);
    };

    const handleSortChange = (e) => {
        const [newSortBy, newSortOrder] = e.target.value.split('-');
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSelectedCategory('');
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('CreatedDate');
        setSortOrder('DESC');
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };

    const handleAddToCart = async (productId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not authenticated
            if (window.confirm('Please login to add items to cart. Go to login page?')) {
                navigate('/login');
            }
            return;
        }

        try {
            await api.post('/cart/add', { productId, quantity: 1 });
            alert('Product added to cart!');
        } catch (err) {
            console.error('Failed to add to cart', err);
            alert('Failed to add to cart. Please try again.');
        }
    };

    return (
        <div className="product-listing-container">
            {/* Header with navigation */}
            <div className="listing-header">
                <h1>SellPoint</h1>
                <div className="header-links">
                    <span onClick={() => navigate('/dashboard')}>My Dashboard</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                </div>
            </div>

            <div className="listing-main">
                {/* Sidebar Filters */}
                <div className="filters-sidebar">
                    <h3>Filters</h3>

                    <div className="filter-section">
                        <h4>Categories</h4>
                        <button
                            className={`category-filter ${selectedCategory === '' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('')}
                        >
                            All Products
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.categoryId}
                                className={`category-filter ${selectedCategory === cat.categoryId ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(cat.categoryId)}
                            >
                                {cat.categoryName}
                            </button>
                        ))}
                    </div>

                    <div className="filter-section">
                        <h4>Price Range</h4>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                        <button onClick={fetchProducts} className="apply-price-btn">
                            Apply
                        </button>
                    </div>

                    <div className="filter-section">
                        <h4>Sort By</h4>
                        <select value={`${sortBy}-${sortOrder}`} onChange={handleSortChange}>
                            <option value="CreatedDate-DESC">Newest First</option>
                            <option value="CreatedDate-ASC">Oldest First</option>
                            <option value="Price-ASC">Price: Low to High</option>
                            <option value="Price-DESC">Price: High to Low</option>
                            <option value="Name-ASC">Name: A to Z</option>
                            <option value="Name-DESC">Name: Z to A</option>
                            <option value="Popularity-DESC">Most Popular</option>
                        </select>
                    </div>

                    <button onClick={handleClearFilters} className="clear-filters-btn">
                        Clear All Filters
                    </button>
                </div>

                {/* Products Grid */}
                <div className="products-main">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>

                    {/* Results count */}
                    <div className="results-info">
                        <p>Showing {products.length} of {totalProducts} products</p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading products...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={fetchProducts}>Try Again</button>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!loading && !error && (
                        <>
                            {products.length === 0 ? (
                                <div className="no-products">
                                    <p>No products found.</p>
                                    <button onClick={handleClearFilters}>Clear Filters</button>
                                </div>
                            ) : (
                                <div className="products-grid">
                                    {products.map(product => (
                                        <ProductCard
                                            key={product.productId}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            {[...Array(totalPages).keys()].map(page => {
                                const pageNum = page + 1;
                                // Show limited page numbers
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={currentPage === pageNum ? 'active' : ''}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                                    return <span key={pageNum}>...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductListing;
