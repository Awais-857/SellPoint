import { addDemoDispute, buildDemoOrder, calculateDemoCartSummary, cancelDemoOrder } from './demoOrderService';

const product = { productId: 1, productName: 'Demo Headphones', businessName: 'Nova Tech', vendorId: 101, price: 100, discountPercent: 10, stockQuantity: 5, isActive: true };
const state = { products: [product], vendors: [{ vendorId: 101, status: 'Approved', isActive: true }], orders: [], disputes: [] };
const session = { role: 'Customer', userId: 301, displayName: 'Mariam Shah' };
const cart = [{ productId: 1, productName: product.productName, vendorId: 101, vendorName: product.businessName, quantity: 2, itemTotal: 180 }];
const address = { addressLine1: '12 Demo Street', city: 'Lahore', state: 'Punjab', zipCode: '54000', country: 'Pakistan' };

describe('demoOrderService', () => {
  test('calculates shipping per vendor, tax and total', () => {
    expect(calculateDemoCartSummary(cart)).toMatchObject({ subtotal: 180, shipping: 5, tax: 18, total: 203, itemCount: 2, vendorCount: 1 });
  });

  test('creates a fictional order and deducts demo stock', () => {
    const result = buildDemoOrder(state, session, cart, address, 'CashOnDelivery', new Date('2026-11-26T10:00:00Z'));
    expect(result.order.orderId).toBe(5001);
    expect(result.order.totalAmount).toBe(203);
    expect(result.order.customerId).toBe(301);
    expect(result.order.shippingAddressSnapshot).toEqual(address);
    expect(result.order.addressId).toBeNull();
    expect(result.nextState.products[0].stockQuantity).toBe(3);
    expect(result.nextState.orders).toHaveLength(1);
    expect(result.nextState.payments).toHaveLength(1);
    expect(result.nextState.payments[0]).toMatchObject({ orderId: result.order.orderId, amount: 203, status: 'Pending' });
  });

  test('deducts and restores the stock of the selected variant only', () => {
    const variantProduct = { ...product, stockQuantity: 5, variants: [
      { variantId: 11, variantName: 'Black', price: 100, stockQuantity: 3 },
      { variantId: 12, variantName: 'White', price: 110, stockQuantity: 2 }
    ] };
    const variantState = { ...state, products: [variantProduct] };
    const variantCart = [{ ...cart[0], variantId: 11, variantName: 'Black', quantity: 2, itemTotal: 180 }];
    const result = buildDemoOrder(variantState, session, variantCart, address, 'CashOnDelivery', new Date('2026-11-26T10:00:00Z'));
    expect(result.order.items[0]).toMatchObject({ variantId: 11, variantName: 'Black', unitPrice: 90 });
    expect(result.nextState.products[0].variants.map(item => item.stockQuantity)).toEqual([1, 2]);
    expect(result.nextState.products[0].stockQuantity).toBe(3);
    const cancelled = cancelDemoOrder(result.nextState, result.order.orderId, session.userId);
    expect(cancelled.products[0].variants.map(item => item.stockQuantity)).toEqual([3, 2]);
    expect(cancelled.products[0].stockQuantity).toBe(5);
  });

  test('requires a variant selection at checkout', () => {
    const variantProduct = { ...product, variants: [{ variantId: 11, variantName: 'Black', stockQuantity: 3 }] };
    expect(() => buildDemoOrder({ ...state, products: [variantProduct] }, session, cart, address, 'CashOnDelivery')).toThrow(/select an available option/);
  });

  test('rejects stock shortages and non-customer sessions', () => {
    expect(() => buildDemoOrder(state, session, [{ ...cart[0], quantity: 6 }], address, 'CashOnDelivery')).toThrow(/remain in stock/);
    expect(() => buildDemoOrder(state, { ...session, role: 'Vendor' }, cart, address, 'CashOnDelivery')).toThrow(/Customer demo session/);
  });

  test("cancels a customer's pending order and restores stock", () => {
    const order = { orderId: 5001, customerId: 301, orderStatus: 'Pending', paymentStatus: 'Pending', items: [{ productId: 1, quantity: 2 }] };
    const cancelled = cancelDemoOrder({ ...state, orders: [order], products: [{ ...product, stockQuantity: 3 }] }, 5001, 301);
    expect(cancelled.orders[0].orderStatus).toBe('Cancelled');
    expect(cancelled.products[0].stockQuantity).toBe(5);
    expect(() => cancelDemoOrder({ ...state, orders: [order] }, 5001, 302)).toThrow(/not found/);
    expect(() => cancelDemoOrder({ ...state, orders: [{ ...order, orderStatus: 'Shipped' }] }, 5001, 301)).toThrow(/Only pending or confirmed orders can be cancelled/);
  });

  test('adds a dispute for an order owned by the customer', () => {
    const order = { orderId: 5001, customerId: 301 };
    const result = addDemoDispute({ ...state, orders: [order] }, 5001, 301, 'Item arrived damaged');
    expect(result.disputes[0]).toMatchObject({ orderId: 5001, customerId: 301, reason: 'Item arrived damaged', status: 'Open' });
    expect(() => addDemoDispute({ ...state, orders: [order] }, 5001, 302, 'Issue')).toThrow(/not found/);
  });
});
