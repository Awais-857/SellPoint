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
    expect(stored.version).toBe(8);
    expect(stored.data.products).toHaveLength(state.products.length);
  });

  test('recovers from malformed or unsupported stored state', () => {
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, '{not valid json');
    const recovered = getDemoState();

    expect(recovered.products.length).toBeGreaterThan(0);
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY)).version).toBe(7);

    saveDemoState({ products: [] });
    const unsupported = getDemoState();
    expect(unsupported.products.length).toBeGreaterThan(0);
  });


  test('migrates existing version 6 demo data without discarding visitor changes', () => {
    const existing = getDemoState();
    existing.products[0].productName = 'Visitor custom product name';
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify({ version: 7, data: existing }));
    const migrated = getDemoState();
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY));
    expect(migrated.products[0].productName).toBe('Visitor custom product name');
    expect(migrated.notifications).toEqual(existing.notifications);
    expect(migrated.payments.length).toBe(migrated.orders.length);
    expect(stored.version).toBe(8);
  });

  test('migrates existing v7 notifications and visitor changes while adding payment records', () => {
    const existing = getDemoState();
    existing.notifications = [{ notificationId: 1, recipientRole: 'Customer', recipientId: 301, title: 'Existing notification' }];
    existing.products[0].productName = 'Saved visitor edit';
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify({ version: 7, data: existing }));
    const migrated = getDemoState();
    expect(migrated.products[0].productName).toBe('Saved visitor edit');
    expect(migrated.notifications).toEqual(existing.notifications);
    expect(migrated.payments.length).toBe(migrated.orders.length);
    expect(JSON.parse(window.localStorage.getItem(DEMO_STATE_STORAGE_KEY)).version).toBe(8);
  });

  test('seed data includes payment records for existing orders', () => {
    const state = getDemoState();
    expect(state.payments).toHaveLength(state.orders.length);
    expect(state.payments.every(payment => state.orders.some(order => order.orderId === payment.orderId))).toBe(true);
  });

  test('seed data includes pending and rejected product submissions', () => {
    const state = getDemoState();
    expect(state.products.some(product => product.moderationStatus === 'Pending')).toBe(true);
    expect(state.products.some(product => product.moderationStatus === 'Rejected' && product.moderationReason)).toBe(true);
  });

  test('seed data includes a default saved delivery address for every customer', () => {
    const state = getDemoState();
    state.customers.forEach(customer => {
      const addresses = state.addresses.filter(address => address.customerId === customer.userId);
      expect(addresses.length).toBeGreaterThan(0);
      expect(addresses.filter(address => address.isDefault)).toHaveLength(1);
    });
  });

  test('seed data includes separately stocked product variants', () => {
    const state = getDemoState();
    const product = state.products.find(item => item.productId === 1001);
    expect(product.variants).toHaveLength(2);
    expect(product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0)).toBe(product.stockQuantity);
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
