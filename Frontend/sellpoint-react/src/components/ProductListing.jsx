// src/components/ProductListing.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import ProductCard from './ProductCard';
import styles from './ProductListing.module.css';
import { addToCart } from '../services/cartHelper';
import { IS_DEMO_MODE } from '../config/appConfig';

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
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState('');
    const [inStock, setInStock] = useState(false);
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
    }, [selectedCategory, appliedSearchTerm, minPrice, maxPrice, minRating, inStock, sortBy, sortOrder, currentPage]);

    const fetchCategories = async () => {
        try {
            const categoriesData = await catalogService.getCategories();
            setCategories(categoriesData);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await catalogService.listProducts({
                categoryId: selectedCategory || undefined,
                searchTerm: appliedSearchTerm || undefined,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                ...(IS_DEMO_MODE ? { minRating: minRating || undefined, inStock } : {}),
                sortBy,
                sortOrder,
                pageNumber: currentPage,
                pageSize
            });

            setProducts(result.products || []);
            setTotalPages(result.totalPages || 1);
            setTotalProducts(result.totalCount || 0);
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
        setAppliedSearchTerm(searchTerm);
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
        setAppliedSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        setMinRating('');
        setInStock(false);
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

    const handleAddToCart = async (product) => {
        if (IS_DEMO_MODE && Array.isArray(product.variants) && product.variants.length) {
            navigate(`/product/${product.productId}`);
            return;
        }
        try {
            await addToCart(product, 1);
            alert(`${product.productName} added to cart!`);
        } catch (err) {
            console.error('Failed to add to cart', err);
            alert('Failed to add to cart. Please try again.');
        }
    };

    return (
        <div className={styles['product-listing-container']}>
            {/* Header with navigation */}
            <div className={styles['listing-header']}>
                <h1>SellPoint</h1>
                <div className={styles['header-links']}>
                    <span onClick={() => navigate(IS_DEMO_MODE ? '/demo/workspace' : '/dashboard')}>{IS_DEMO_MODE ? 'Demo Workspace' : 'My Dashboard'}</span>
                    <span onClick={() => navigate('/cart')}>Cart 🛒</span>
                </div>
            </div>

            <div className={styles['listing-main']}>
                {/* Sidebar Filters */}
                <div className={styles['filters-sidebar']}>
                    <h3>Filters</h3>

                    <div className={styles['filter-section']}>
                        <h4>Categories</h4>
                        <button
                            className={styles['category-filter'] + (selectedCategory === '' ? ` ${styles['active']}` : '')}
                            onClick={() => handleCategoryChange('')}
                        >
                            All Products
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.categoryId}
                                className={styles['category-filter'] + (selectedCategory === cat.categoryId ? ` ${styles['active']}` : '')}
                                onClick={() => handleCategoryChange(cat.categoryId)}
                            >
                                {cat.categoryName}
                            </button>
                        ))}
                    </div>

                    <div className={styles['filter-section']}>
                        <h4>Price Range</h4>
                        <div className={styles['price-inputs']}>
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
                        <button onClick={fetchProducts} className={styles['apply-price-btn']}>
                            Apply
                        </button>
                    </div>

                    {IS_DEMO_MODE && (
                        <>
                            <div className={styles['filter-section']}>
                                <h4>Minimum Rating</h4>
                                <select value={minRating} onChange={e => { setMinRating(e.target.value); setCurrentPage(1); }}>
                                    <option value="">Any rating</option>
                                    <option value="4">4 stars & up</option>
                                    <option value="3">3 stars & up</option>
                                    <option value="2">2 stars & up</option>
                                </select>
                            </div>
                            <div className={styles['filter-section']}>
                                <label><input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setCurrentPage(1); }} /> In-stock products only</label>
                            </div>
                        </>
                    )}

                    <div className={styles['filter-section']}>
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

                    <button onClick={handleClearFilters} className={styles['clear-filters-btn']}>
                        Clear All Filters
                    </button>
                </div>

                {/* Products Grid */}
                <div className={styles['products-main']}>
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className={styles['search-bar']}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>

                    {/* Results count */}
                    <div className={styles['results-info']}>
                        <p>Showing {products.length} of {totalProducts} products</p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className={styles['loading-state']}>
                            <div className={styles['spinner']}></div>
                            <p>Loading products...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className={styles['error-state']}>
                            <p>{error}</p>
                            <button onClick={fetchProducts}>Try Again</button>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!loading && !error && (
                        <>
                            {products.length === 0 ? (
                                <div className={styles['no-products']}>
                                    <p>No products found.</p>
                                    <button onClick={handleClearFilters}>Clear Filters</button>
                                </div>
                            ) : (
                                <div className={styles['products-grid']}>
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
                        <div className={styles['pagination']}>
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
                                            className={styles[currentPage === pageNum ? 'active-page' : 'page-button']}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                                    return <span key={pageNum} className={styles['ellipsis']}>
                                        ...
                                    </span>;
                                }
                                return null;
                            })
}
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
