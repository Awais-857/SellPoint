import {
  DEMO_SESSION_STORAGE_KEY,
  DEMO_CART_STORAGE_KEY,
  clearDemoStorage,
  DEMO_STATE_STORAGE_KEY,
  clearDemoSession,
  getDemoSession,
  getDemoState,
  resetDemoState,
  saveDemoSession,
  saveDemoState,
  startDemoSession
} from './demoStorage';

describe('demoStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('creates and persists the baseline demo data on first access', () => {
    const state = getDemoState();
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY));

    expect(state.products.length).toBeGreaterThan(0);
    expect(stored.version).toBe(2);
    expect(stored.data.products).toHaveLength(state.products.length);
  });

  test('recovers from malformed or unsupported stored state', () => {
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, '{not valid json');
    const recovered = getDemoState();

    expect(recovered.products.length).toBeGreaterThan(0);
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY)).version).toBe(2);

    saveDemoState({ products: [] });
    const unsupported = getDemoState();
    expect(unsupported.products.length).toBeGreaterThan(0);
  });

  test('seed data includes product imagery and a multi-vendor parent order', () => {
    const state = getDemoState();
    const multiVendorOrder = state.orders.find(order => order.orderId === 5016);
    expect(state.products.every(product => Boolean(product.imageUrl))).toBe(true);
    expect(new Set(multiVendorOrder.items.map(item => item.vendorId)).size).toBe(2);
    expect(multiVendorOrder.orderStatus).toBe('Processing');
  });

  test('reset restores the original baseline dataset', () => {
    const initial = getDemoState();
    saveDemoState({ ...initial, products: [] });

    const reset = resetDemoState();
    expect(reset.products).toHaveLength(initial.products.length);
  });

  test('creates and restores a valid role-specific demo session', () => {
    const session = startDemoSession('Customer');

    expect(session.role).toBe('Customer');
    expect(getDemoSession().userId).toBe(session.userId);
    expect(JSON.parse(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).role).toBe('Customer');
  });

  test('supports selecting approved, pending, rejected and suspended vendor identities', () => {
    const rejected = startDemoSession('Vendor', 106);
    expect(rejected).toMatchObject({ vendorId: 106, businessName: 'Fashion Corner', displayName: 'Noor Fatima' });
    const suspended = startDemoSession('Vendor', 105);
    expect(suspended).toMatchObject({ vendorId: 105, businessName: 'Pixel Gaming' });
    expect(() => startDemoSession('Vendor', 999)).toThrow(/valid demo vendor/);
  });

  test('clears all demo-only storage, including cart, without touching API storage', () => {
    window.localStorage.setItem(DEMO_CART_STORAGE_KEY, JSON.stringify([{ productId: 1 }]));
    window.localStorage.setItem('sellpoint_demo_wishlist_v1', JSON.stringify([1]));
    window.localStorage.setItem('token', 'api-token');
    window.localStorage.setItem('guestCart', JSON.stringify([{ productId: 2 }]));

    clearDemoStorage();

    expect(window.localStorage.getItem(DEMO_CART_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem('sellpoint_demo_wishlist_v1')).toBeNull();
    expect(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem('token')).toBe('api-token');
    expect(window.localStorage.getItem('guestCart')).not.toBeNull();
  });

  test('rejects invalid roles and clears the current demo session', () => {
    expect(() => startDemoSession('SuperUser')).toThrow();
    saveDemoSession({ role: 'Vendor', userId: 201 });
    clearDemoSession();

    expect(getDemoSession()).toBeNull();
    expect(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
  });
});
