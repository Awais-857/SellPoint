import { DEMO_WISHLIST_KEY, getDemoWishlist, getDemoWishlistIds, removeDemoWishlistItem, toggleDemoWishlistItem } from './demoWishlistService';

const state = {
  vendors: [{ vendorId: 101, status: 'Approved', isActive: true }, { vendorId: 102, status: 'Approved', isActive: false }],
  products: [
    { productId: 1, productName: 'Visible Product', vendorId: 101, isActive: true, stockQuantity: 4 },
    { productId: 2, productName: 'Out of Stock', vendorId: 101, isActive: true, stockQuantity: 0 },
    { productId: 3, productName: 'Suspended Seller Product', vendorId: 102, isActive: true, stockQuantity: 5 }
  ]
};

describe('demoWishlistService', () => {
  beforeEach(() => localStorage.clear());

  test('adds, toggles and removes wishlist items without duplicates', () => {
    expect(toggleDemoWishlistItem(1)).toEqual([1]);
    expect(toggleDemoWishlistItem(1)).toEqual([]);
    toggleDemoWishlistItem(1);
    toggleDemoWishlistItem(2);
    expect(getDemoWishlistIds()).toEqual([1, 2]);
    expect(removeDemoWishlistItem(1)).toEqual([2]);
    expect(JSON.parse(localStorage.getItem(DEMO_WISHLIST_KEY))).toEqual([2]);
  });

  test('marks out-of-stock and hidden vendor products unavailable', () => {
    toggleDemoWishlistItem(1);
    toggleDemoWishlistItem(2);
    toggleDemoWishlistItem(3);
    toggleDemoWishlistItem(999);
    const items = getDemoWishlist(state);
    expect(items.find(item => item.productId === 1).isAvailable).toBe(true);
    expect(items.find(item => item.productId === 2).isAvailable).toBe(false);
    expect(items.find(item => item.productId === 3).isVisible).toBe(false);
    expect(items.find(item => item.productId === 999)).toMatchObject({ isMissing: true, isAvailable: false });
  });

  test('ignores malformed wishlist storage', () => {
    localStorage.setItem(DEMO_WISHLIST_KEY, '{bad json');
    expect(getDemoWishlistIds()).toEqual([]);
  });
});
