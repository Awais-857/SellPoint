import {
  getPublicDemoStores,
  getPublicDemoStore,
  getPublicDemoStoreProducts,
  getPublicDemoStoreReviews,
  isPublicDemoStore,
  saveVendorStoreProfile
} from './demoStoreService';

const state = {
  vendors: [
    { vendorId: 101, businessName: 'Approved Shop', status: 'Approved', isActive: true, publicEmail: 'hello@shop.test' },
    { vendorId: 102, businessName: 'Pending Shop', status: 'Pending', isActive: true },
    { vendorId: 103, businessName: 'Paused Shop', status: 'Approved', isActive: false }
  ],
  products: [
    { productId: 1, vendorId: 101, productName: 'Visible item', categoryId: 1, categoryName: 'Tech', description: 'A product', price: 20, stockQuantity: 4, isActive: true, moderationStatus: 'Approved', createdAt: '2026-01-01' },
    { productId: 2, vendorId: 101, productName: 'Pending item', categoryId: 1, categoryName: 'Tech', price: 30, isActive: true, moderationStatus: 'Pending' },
    { productId: 3, vendorId: 102, productName: 'Pending store item', categoryId: 2, categoryName: 'Home', price: 10, isActive: true, moderationStatus: 'Approved' },
    { productId: 4, vendorId: 103, productName: 'Paused store item', categoryId: 2, categoryName: 'Home', price: 10, isActive: true, moderationStatus: 'Approved' }
  ],
  reviews: [
    { reviewId: 1, vendorId: 101, productId: 1, status: 'Approved', rating: 5, createdAt: '2026-02-01' },
    { reviewId: 2, vendorId: 101, productId: 1, status: 'Pending', rating: 1, createdAt: '2026-02-02' },
    { reviewId: 3, vendorId: 102, productId: 3, status: 'Approved', rating: 4, createdAt: '2026-02-03' }
  ]
};

describe('demoStoreService', () => {
  test('shows only approved and active stores', () => {
    expect(isPublicDemoStore(state.vendors[0])).toBe(true);
    expect(isPublicDemoStore(state.vendors[1])).toBe(false);
    expect(isPublicDemoStore(state.vendors[2])).toBe(false);
    expect(getPublicDemoStores(state).map(store => store.vendorId)).toEqual([101]);
  });

  test('hides products unless both product and vendor are public', () => {
    expect(getPublicDemoStoreProducts(state, 102).totalCount).toBe(0);
    expect(getPublicDemoStoreProducts(state, 103).totalCount).toBe(0);
    expect(getPublicDemoStoreProducts(state, 101).products.map(item => item.productId)).toEqual([1]);
  });

  test('returns null for hidden stores and calculates approved-review summaries only', () => {
    expect(getPublicDemoStore(state, 102)).toBeNull();
    expect(getPublicDemoStore(state, 101)).toMatchObject({
      publicProductCount: 1,
      publicReviewCount: 1,
      averageRating: 5
    });
    expect(getPublicDemoStoreReviews(state, 101)).toHaveLength(1);
  });

  test('supports store product search, category filtering, sorting and pagination', () => {
    const expanded = {
      ...state,
      products: [
        ...state.products,
        { ...state.products[0], productId: 5, productName: 'Another item', price: 5, createdAt: '2026-02-01' }
      ]
    };
    expect(getPublicDemoStoreProducts(expanded, 101, { search: 'another' }).totalCount).toBe(1);
    expect(getPublicDemoStoreProducts(expanded, 101, { categoryId: 2 }).totalCount).toBe(0);
    expect(getPublicDemoStoreProducts(expanded, 101, { sortBy: 'price-low' }).products[0].price).toBe(5);
    expect(getPublicDemoStoreProducts(expanded, 101, { pageSize: 1, page: 2 }).products).toHaveLength(1);
  });

  test('allows a store owner to update public profile fields without changing other vendors', () => {
    const next = saveVendorStoreProfile(state, 101, {
      tagline: 'Useful tech for everyday life',
      description: 'Welcome to our store.',
      logoUrl: 'https://example.test/logo.png',
      bannerUrl: 'https://example.test/banner.jpg',
      publicEmail: 'contact@shop.test',
      publicPhone: '+1 555 0100',
      city: 'Lahore',
      country: 'Pakistan'
    });
    expect(next.vendors[0]).toMatchObject({ tagline: 'Useful tech for everyday life', publicEmail: 'contact@shop.test', city: 'Lahore' });
    expect(next.vendors[1]).toBe(state.vendors[1]);
  });

  test('rejects hidden vendor profile edits and invalid public contact data', () => {
    expect(() => saveVendorStoreProfile(state, 102, {})).toThrow(/approved and active/);
    expect(() => saveVendorStoreProfile(state, 101, { publicEmail: 'not-an-email' })).toThrow(/valid public contact email/);
    expect(() => saveVendorStoreProfile(state, 101, { logoUrl: 'javascript:alert(1)' })).toThrow(/HTTP or HTTPS/);
    expect(() => saveVendorStoreProfile(state, 101, { tagline: 'x'.repeat(121) })).toThrow(/120 characters/);
  });
});
