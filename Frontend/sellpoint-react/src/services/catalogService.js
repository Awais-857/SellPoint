// Catalog adapter shared by API Mode and Demo Mode.
//
// Contract:
// - listProducts(filters) -> { products, totalCount, totalPages }
// - getProductById(id) -> product or null
// - getCategories() -> category[]
// - getProductReviews(id) -> review[]
//
// Both implementations return the same application-facing shapes. Components
// should depend on this service rather than choosing Axios or local storage.

import api from './api';
import { IS_DEMO_MODE } from '../config/appConfig';
import { getDemoState } from '../demo/demoStorage';

const normalizeFilters = (filters = {}) => ({
  categoryId: filters.categoryId ? Number(filters.categoryId) : null,
  searchTerm: (filters.searchTerm || '').trim().toLowerCase(),
  minPrice: filters.minPrice === '' || filters.minPrice == null ? null : Number(filters.minPrice),
  maxPrice: filters.maxPrice === '' || filters.maxPrice == null ? null : Number(filters.maxPrice),
  sortBy: filters.sortBy || 'CreatedDate',
  sortOrder: (filters.sortOrder || 'DESC').toUpperCase(),
  pageNumber: Math.max(1, Number(filters.pageNumber) || 1),
  pageSize: Math.max(1, Number(filters.pageSize) || 12)
});

const demoCatalogService = {
  async listProducts(filters = {}) {
    const options = normalizeFilters(filters);
    let products = getDemoState().products.filter(product => product.isActive);

    if (options.categoryId) {
      products = products.filter(product => product.categoryId === options.categoryId);
    }
    if (options.searchTerm) {
      products = products.filter(product =>
        [product.productName, product.description, product.businessName, product.categoryName]
          .some(value => (value || '').toLowerCase().includes(options.searchTerm))
      );
    }
    if (options.minPrice !== null) {
      products = products.filter(product => product.price >= options.minPrice);
    }
    if (options.maxPrice !== null) {
      products = products.filter(product => product.price <= options.maxPrice);
    }

    const sortFields = {
      CreatedDate: 'createdAt',
      Price: 'price',
      Name: 'productName',
      Popularity: 'reviewCount'
    };
    const field = sortFields[options.sortBy] || 'createdAt';
    const direction = options.sortOrder === 'ASC' ? 1 : -1;
    products = [...products].sort((a, b) => {
      const left = a[field] ?? '';
      const right = b[field] ?? '';
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });

    const totalCount = products.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / options.pageSize));
    const start = (options.pageNumber - 1) * options.pageSize;

    return {
      products: products.slice(start, start + options.pageSize).map(product => ({
        ...product,
        averageRating: product.averageRating || 0,
        reviewCount: product.reviewCount || 0
      })),
      totalCount,
      totalPages
    };
  },

  async getProductById(id) {
    const product = getDemoState().products.find(item =>
      item.productId === Number(id) && item.isActive
    );
    if (!product) return null;

    const reviews = getDemoState().reviews.filter(review =>
      review.productId === product.productId && review.status === 'Approved'
    );
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return {
      ...product,
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount: reviews.length
    };
  },

  async getCategories() {
    return getDemoState().categories.filter(category => category.isActive);
  },

  async getProductReviews(id) {
    return getDemoState().reviews
      .filter(review => review.productId === Number(id) && review.status === 'Approved')
      .map(review => ({
        ...review,
        createdDate: review.createdAt
      }));
  }
};

const apiCatalogService = {
  async listProducts(filters = {}) {
    const response = await api.get('/products', { params: filters });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  async getProductReviews(id) {
    const response = await api.get(`/products/${id}/reviews`);
    return response.data;
  }
};

export const catalogService = IS_DEMO_MODE ? demoCatalogService : apiCatalogService;
export { demoCatalogService, apiCatalogService };
