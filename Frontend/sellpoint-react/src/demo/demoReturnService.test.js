import {
  createDemoReturnRequest, decideDemoReturnAsVendor, decideDemoReturnAsAdmin,
  escalateDemoReturn, getReturnEligibility
} from './demoReturnService';

const fixture = () => ({
  customers: [{ userId: 301, name: 'Mariam Shah' }],
  vendors: [{ vendorId: 101, businessName: 'Nova Tech Store' }],
  products: [{ productId: 1001, stockQuantity: 12, variants: [{ variantId: 10011, stockQuantity: 7 }, { variantId: 10012, stockQuantity: 5 }] }],
  orders: [{
    orderId: 5017, customerId: 301, customerName: 'Mariam Shah', orderStatus: 'Delivered',
    deliveredAt: '2026-11-22T10:00:00.000Z',
    items: [{ orderItemId: 8201, productId: 1001, productName: 'Wireless Headphones', vendorId: 101,
      vendorName: 'Nova Tech Store', variantId: 10011, variantName: 'Black', quantity: 2,
      unitPrice: 80.99, itemTotal: 161.98, itemStatus: 'Delivered', deliveredAt: '2026-11-22T10:00:00.000Z' }]
  }],
  payments: [{ paymentId: 20017, orderId: 5017, customerId: 301, amount: 183.18, status: 'Paid', refundedAmount: 0, refundStatus: 'Not refunded', refunds: [], transactions: [] }],
  returnRequests: []
});
const now = new Date('2026-11-27T10:00:00.000Z');
const create = (state = fixture(), quantity = 1) => createDemoReturnRequest(state, {
  orderId: 5017, orderItemId: 8201, customerId: 301, quantity, reason: 'Item is not as expected'
}, now);

describe('demoReturnService', () => {
  test('allows delivered item within 30 days', () => {
    expect(getReturnEligibility(fixture(), 5017, 8201, 301, now).eligible).toBe(true);
  });
  test('keeps the 30-day boundary and rejects after it', () => {
    const state = fixture();
    state.orders[0].items[0].deliveredAt = '2026-10-28T10:00:00.000Z';
    expect(getReturnEligibility(state, 5017, 8201, 301, now).eligible).toBe(true);
    state.orders[0].items[0].deliveredAt = '2026-10-28T09:59:59.000Z';
    expect(getReturnEligibility(state, 5017, 8201, 301, now).eligible).toBe(false);
  });
  test('rejects undelivered and expired items', () => {
    const state = fixture();
    state.orders[0].items[0].itemStatus = 'Shipped';
    expect(getReturnEligibility(state, 5017, 8201, 301, now).eligible).toBe(false);
    const old = fixture();
    old.orders[0].items[0].deliveredAt = '2026-10-01T10:00:00.000Z';
    expect(getReturnEligibility(old, 5017, 8201, 301, now).reason).toMatch(/expired/);
  });
  test('prevents another request for the same order item', () => {
    const state = create();
    expect(() => createDemoReturnRequest(state, { orderId: 5017, orderItemId: 8201, customerId: 301, quantity: 1, reason: 'Again' }, now)).toThrow(/already exists/);
  });
  test('allows partial quantity and calculates refund from recorded purchase price', () => {
    const state = create(fixture(), 1);
    expect(state.returnRequests[0].quantity).toBe(1);
    expect(state.returnRequests[0].refundAmount).toBe(80.99);
  });
  test('refunds partial quantities using the coupon-discounted net line total', () => {
    const discounted = fixture();
    discounted.orders[0].items[0].itemTotal = 145.78;
    discounted.orders[0].items[0].unitPrice = 72.89;
    const requested = create(discounted, 1);
    expect(requested.returnRequests[0]).toMatchObject({ unitPrice: 72.89, refundAmount: 72.89 });
    const approved = decideDemoReturnAsVendor(requested, requested.returnRequests[0].returnId, 101, 'Approved', {}, now);
    expect(approved.payments[0].refundedAmount).toBe(72.89);
  });
  test('does not attempt a cash refund for an item fully covered by a coupon', () => {
    const freeItem = fixture();
    freeItem.orders[0].items[0].itemTotal = 0;
    freeItem.orders[0].items[0].unitPrice = 0;
    const requested = create(freeItem, 1);
    expect(requested.returnRequests[0]).toMatchObject({ refundAmount: 0, unitPrice: 0 });
    const approved = decideDemoReturnAsVendor(requested, requested.returnRequests[0].returnId, 101, 'Approved', {}, now);
    expect(approved.returnRequests[0].refundStatus).toBe('No refund due');
    expect(approved.payments[0].refundedAmount).toBe(0);
  });
  test('rejects quantity above purchased amount and blank reason', () => {
    expect(() => create(fixture(), 3)).toThrow(/between 1 and 2/);
    expect(() => createDemoReturnRequest(fixture(), { orderId: 5017, orderItemId: 8201, customerId: 301, quantity: 1, reason: ' ' }, now)).toThrow(/reason/);
  });
  test('prevents a different customer from requesting another customer return', () => {
    expect(() => createDemoReturnRequest(fixture(), { orderId: 5017, orderItemId: 8201, customerId: 302, quantity: 1, reason: 'Wrong user' }, now)).toThrow(/Order not found/);
  });
  test('enforces vendor ownership', () => {
    const state = create();
    expect(() => decideDemoReturnAsVendor(state, state.returnRequests[0].returnId, 102, 'Approved')).toThrow(/not found for this vendor/);
  });
  test('vendor approval records simulated refund and restocks exact variant once', () => {
    const state = create();
    const id = state.returnRequests[0].returnId;
    const approved = decideDemoReturnAsVendor(state, id, 101, 'Approved', { restock: true }, now);
    expect(approved.returnRequests[0].refundStatus).toBe('Simulated refund recorded');
    expect(approved.payments[0]).toMatchObject({ status: 'Partially Refunded', refundedAmount: 80.99 });
    expect(approved.products[0].variants[0].stockQuantity).toBe(8);
    expect(approved.products[0].variants[1].stockQuantity).toBe(5);
    expect(approved.products[0].stockQuantity).toBe(13);
    expect(() => decideDemoReturnAsVendor(approved, id, 101, 'Approved', { restock: true }, now)).toThrow(/no longer awaiting/);
    expect(approved.products[0].variants[0].stockQuantity).toBe(8);
  });
  test('customer can escalate a vendor rejection and admin makes final decision', () => {
    const state = create();
    const id = state.returnRequests[0].returnId;
    const rejected = decideDemoReturnAsVendor(state, id, 101, 'Rejected', { notes: 'Outside policy' }, now);
    const escalated = escalateDemoReturn(rejected, id, 301, 'Please review this decision.', now);
    expect(escalated.returnRequests[0].status).toBe('Escalated');
    const final = decideDemoReturnAsAdmin(escalated, id, 'Approved', { restock: true, notes: 'Customer evidence accepted' }, now);
    expect(final.returnRequests[0].status).toBe('Approved by Admin');
    expect(final.returnRequests[0].refundAmount).toBe(80.99);
    expect(final.payments[0]).toMatchObject({ status: 'Partially Refunded', refundedAmount: 80.99 });
    expect(final.products[0].variants[0].stockQuantity).toBe(8);
  });
  test('admin cannot decide a request that was not escalated', () => {
    const state = create();
    expect(() => decideDemoReturnAsAdmin(state, state.returnRequests[0].returnId, 'Approved')).toThrow(/Only escalated/);
  });
});
