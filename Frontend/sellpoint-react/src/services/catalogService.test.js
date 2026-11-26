import { demoCatalogService } from './catalogService';
import { getDemoState } from '../demo/demoStorage';

jest.mock('../demo/demoStorage', () => ({
  getDemoState: jest.fn()
}));

const demoState = {
  categories: [
    { categoryId: 1, categoryName: 'Electronics', isActive: true },
    { categoryId: 2, categoryName: 'Home', isActive: true },
    { categoryId: 3, categoryName: 'Hidden', isActive: false }
  ],
  products: [
    {
      productId: 1, productName: 'Wireless Headphones', categoryId: 1,
      price: 80, isActive: true, createdAt: '2026-01-02',
      description: 'Bluetooth audio', businessName: 'Nova Tech',
      categoryName: 'Electronics'
    },
    {
      productId: 2, productName: 'Smart Watch', categoryId: 1,
      price: 120, isActive: true, createdAt: '2026-01-03',
      description: 'Wearable technology', businessName: 'Nova Tech',
      categoryName: 'Electronics'
    },
    {
      productId: 3, productName: 'Desk Lamp', categoryId: 2,
      price: 35, isActive: true, createdAt: '2026-01-01',
      description: 'Home lighting', businessName: 'Urban Home',
      categoryName: 'Home'
    },
    {
      productId: 4, productName: 'Hidden Product', categoryId: 2,
      price: 15, isActive: false, createdAt: '2026-01-04',
      description: 'Not listed', businessName: 'Urban Home',
      categoryName: 'Home'
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
