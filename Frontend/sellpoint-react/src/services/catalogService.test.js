import { vi } from 'vitest';
import { demoCatalogService } from './catalogService';
import { getDemoState } from '../demo/demoStorage';

vi.mock('../demo/demoStorage', () => ({
  getDemoState: jest.fn()
}));

const demoState = {
  vendors: [
    { vendorId: 101, status: 'Approved', isActive: true },
    { vendorId: 102, status: 'Approved', isActive: true },
    { vendorId: 103, status: 'Pending', isActive: true },
    { vendorId: 104, status: 'Approved', isActive: false }
  ],
  categories: [
    { categoryId: 1, categoryName: 'Electronics', isActive: true },
    { categoryId: 2, categoryName: 'Home', isActive: true },
    { categoryId: 3, categoryName: 'Hidden', isActive: false }
  ],
  products: [
    {
      productId: 1, productName: 'Wireless Headphones', categoryId: 1, vendorId: 101,
      price: 80, stockQuantity: 5, isActive: true, createdAt: '2026-01-02',
      description: 'Bluetooth audio', businessName: 'Nova Tech',
      categoryName: 'Electronics'
    },
    {
      productId: 2, productName: 'Smart Watch', categoryId: 1, vendorId: 101,
      price: 120, stockQuantity: 0, isActive: true, createdAt: '2026-01-03',
      description: 'Wearable technology', businessName: 'Nova Tech',
      categoryName: 'Electronics'
    },
    {
      productId: 3, productName: 'Desk Lamp', categoryId: 2, vendorId: 102,
      price: 35, stockQuantity: 8, isActive: true, createdAt: '2026-01-01',
      description: 'Home lighting', businessName: 'Urban Home',
      categoryName: 'Home'
    },
    {
      productId: 4, productName: 'Hidden Product', categoryId: 2, vendorId: 102,
      price: 15, stockQuantity: 0, isActive: false, createdAt: '2026-01-04',
      description: 'Not listed', businessName: 'Urban Home',
      categoryName: 'Home'
    },
    {
      productId: 5, productName: 'Pending Vendor Product', categoryId: 1, vendorId: 103,
      price: 50, isActive: true, stockQuantity: 10, createdAt: '2026-01-05',
      description: 'Not public until vendor approval', businessName: 'Pending Shop',
      categoryName: 'Electronics'
    },
    {
      productId: 6, productName: 'Suspended Vendor Product', categoryId: 1, vendorId: 104,
      price: 60, isActive: true, stockQuantity: 10, createdAt: '2026-01-06',
      description: 'Hidden while vendor is suspended', businessName: 'Suspended Shop',
      categoryName: 'Electronics'
    },
    {
      productId: 7, productName: 'Awaiting Approval', categoryId: 1, vendorId: 101,
      price: 45, isActive: true, moderationStatus: 'Pending', stockQuantity: 5, createdAt: '2026-01-07',
      description: 'Not public before admin approval', businessName: 'Nova Tech', categoryName: 'Electronics'
    }
  ],
  reviews: [
    { reviewId: 1, productId: 1, rating: 5, status: 'Approved', createdAt: '2026-02-01' },
    { reviewId: 2, productId: 1, rating: 3, status: 'Approved', createdAt: '2026-02-02' },
    { reviewId: 3, productId: 1, rating: 1, status: 'Pending', createdAt: '2026-02-03' }
  ]
};

describe('demoCatalogService', () => {
  beforeEach(() => {
    getDemoState.mockReturnValue(demoState);
  });

  test('lists active products with pagination metadata', async () => {
    const result = await demoCatalogService.listProducts({ pageSize: 2, pageNumber: 1 });

    expect(result.products).toHaveLength(2);
    expect(result.totalCount).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  test('filters products by category, search term, and price range', async () => {
    const result = await demoCatalogService.listProducts({
      categoryId: '1',
      searchTerm: 'headphones',
      minPrice: 50,
      maxPrice: 100
    });

    expect(result.products.map(product => product.productName)).toEqual(['Wireless Headphones']);
  });

  test('sorts products by price in ascending order', async () => {
    const result = await demoCatalogService.listProducts({
      sortBy: 'Price',
      sortOrder: 'ASC'
    });

    expect(result.products.map(product => product.price)).toEqual([35, 80, 120]);
  });

  test('hides active products from pending vendors in lists and details', async () => {
    const result = await demoCatalogService.listProducts();
    expect(result.products.some(product => [5, 6].includes(product.productId))).toBe(false);
    await expect(demoCatalogService.getProductById(5)).resolves.toBeNull();
    await expect(demoCatalogService.getProductById(6)).resolves.toBeNull();
  });

  test('hides pending and rejected product submissions from lists and details', async () => {
    const stateWithRejected = { ...demoState, products: [...demoState.products, { ...demoState.products[0], productId: 8, moderationStatus: 'Rejected', isActive: true }] };
    getDemoState.mockReturnValue(stateWithRejected);
    const result = await demoCatalogService.listProducts();
    expect(result.products.some(product => [7, 8].includes(product.productId))).toBe(false);
    await expect(demoCatalogService.getProductById(7)).resolves.toBeNull();
    await expect(demoCatalogService.getProductById(8)).resolves.toBeNull();
  });

  test('filters by minimum rating and available stock', async () => {
    const rated = await demoCatalogService.listProducts({ minRating: 4 });
    expect(rated.products.map(product => product.productId)).toEqual([1]);
    const inStock = await demoCatalogService.listProducts({ inStock: true });
    expect(inStock.products.every(product => product.stockQuantity > 0)).toBe(true);
  });

  test('returns only active categories', async () => {
    const result = await demoCatalogService.getCategories();

    expect(result.map(category => category.categoryName)).toEqual(['Electronics', 'Home']);
  });

  test('returns product details with approved review statistics', async () => {
    const product = await demoCatalogService.getProductById(1);

    expect(product.productName).toBe('Wireless Headphones');
    expect(product.averageRating).toBe(4);
    expect(product.reviewCount).toBe(2);
  });

  test('updates public rating aggregates only when a review is approved', async () => {
    const pendingReview = { reviewId: 4, productId: 1, rating: 5, status: 'Pending' };
    getDemoState.mockReturnValue({ ...demoState, reviews: [...demoState.reviews, pendingReview] });
    const beforeApproval = await demoCatalogService.getProductById(1);
    expect(beforeApproval.averageRating).toBe(4);
    expect(beforeApproval.reviewCount).toBe(2);
    getDemoState.mockReturnValue({ ...demoState, reviews: [...demoState.reviews, { ...pendingReview, status: 'Approved' }] });
    const afterApproval = await demoCatalogService.getProductById(1);
    expect(afterApproval.averageRating).toBe(4.3);
    expect(afterApproval.reviewCount).toBe(3);
    getDemoState.mockReturnValue({ ...demoState, reviews: [...demoState.reviews, { ...pendingReview, status: 'Removed' }] });
    const afterRemoval = await demoCatalogService.getProductById(1);
    expect(afterRemoval.averageRating).toBe(4);
    expect(afterRemoval.reviewCount).toBe(2);
  });

  test('does not return inactive or missing products', async () => {
    await expect(demoCatalogService.getProductById(4)).resolves.toBeNull();
    await expect(demoCatalogService.getProductById(999)).resolves.toBeNull();
  });

  test('returns approved reviews only', async () => {
    const reviews = await demoCatalogService.getProductReviews(1);

    expect(reviews).toHaveLength(2);
    expect(reviews.every(review => review.status === 'Approved')).toBe(true);
    expect(reviews[0].createdDate).toBe('2026-02-01');
  });
});
