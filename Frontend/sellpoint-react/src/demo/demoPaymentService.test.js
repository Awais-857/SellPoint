import { createDemoPayment, getOrderDemoPayment, recordDemoRefund, simulateDemoCardPayment } from './demoPaymentService';

const baseOrder = { orderId: 5001, customerId: 301, totalAmount: 203, paymentMethod: 'Demo Card (no charge)',
  items: [{ productId: 1, quantity: 2, variantId: 11 }] };
const baseState = () => ({
  orders: [baseOrder], payments: [createDemoPayment(baseOrder, [], new Date('2026-11-27T10:00:00Z'))],
  products: [{ productId: 1, stockQuantity: 5, variants: [{ variantId: 11, stockQuantity: 3 }, { variantId: 12, stockQuantity: 2 }] }]
});

describe('demoPaymentService', () => {
  test('creates a pending payment linked to its order', () => {
    expect(createDemoPayment(baseOrder, [], new Date('2026-11-27T10:00:00Z'))).toMatchObject({
      paymentId: 20001, orderId: 5001, customerId: 301, amount: 203, method: 'Demo Card (no charge)', status: 'Pending'
    });
  });

  test('records a successful simulated card payment and advances the order', () => {
    const state = baseState();
    const next = simulateDemoCardPayment(state, 5001, 301, 'Success', new Date('2026-11-27T11:00:00Z'));
    expect(next.payments[0]).toMatchObject({ status: 'Paid', paidAt: '2026-11-27T11:00:00.000Z' });
    expect(next.orders[0]).toMatchObject({ paymentStatus: 'Paid', orderStatus: 'Processing' });
    expect(next.products[0].variants.map(item => item.stockQuantity)).toEqual([1, 2]);
  });

  test('records a failed payment, cancels the order and restores the exact variant stock', () => {
    const next = simulateDemoCardPayment(baseState(), 5001, 301, 'Failure', new Date('2026-11-27T11:00:00Z'));
    expect(next.payments[0].status).toBe('Failed');
    expect(next.orders[0]).toMatchObject({ paymentStatus: 'Failed', orderStatus: 'Cancelled' });
    expect(next.products[0].variants.map(item => item.stockQuantity)).toEqual([3, 2]);
    expect(next.products[0].stockQuantity).toBe(5);
  });

  test('prevents another customer or duplicate payment attempt', () => {
    const state = baseState();
    expect(() => simulateDemoCardPayment(state, 5001, 302, 'Success')).toThrow(/not found/);
    const paid = simulateDemoCardPayment(state, 5001, 301, 'Success');
    expect(() => simulateDemoCardPayment(paid, 5001, 301, 'Failure')).toThrow(/no longer awaiting/);
  });

  test('records partial and full simulated refunds without exceeding captured amount', () => {
    const paid = simulateDemoCardPayment(baseState(), 5001, 301, 'Success');
    const partial = recordDemoRefund(paid, 5001, 80, 'return-1');
    expect(partial.payments[0]).toMatchObject({ status: 'Partially Refunded', refundedAmount: 80 });
    const full = recordDemoRefund(partial, 5001, 123, 'return-2');
    expect(full.payments[0]).toMatchObject({ status: 'Refunded', refundedAmount: 203 });
    expect(() => recordDemoRefund(full, 5001, 1, 'return-3')).toThrow(/no more than 0.00/);
  });

  test('returns payment only to the matching customer', () => {
    expect(getOrderDemoPayment(baseState(), 5001, 302)).toBeNull();
    expect(getOrderDemoPayment(baseState(), 5001, 301).orderId).toBe(5001);
  });
});
