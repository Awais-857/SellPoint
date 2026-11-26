import { deleteVendorProduct, getVendorOrders, getVendorProducts, getVendorRevenue, saveVendorProduct, toggleVendorProduct, updateVendorOrderItemStatus } from './demoVendorService';

const vendor = { vendorId: 101, userId: 201, businessName: 'Nova Tech Store', ownerName: 'Hamza Ali', email: 'nova@example.demo', status: 'Approved', isActive: true };
const product = { productId: 1001, productName: 'Headphones', categoryId: 1, categoryName: 'Electronics', vendorId: 101, businessName: vendor.businessName, price: 100, stockQuantity: 5, discountPercent: 0, isActive: true };
const order = { orderId: 5001, customerId: 301, customerName: 'Mariam Shah', orderDate: '2026-03-01', orderStatus: 'Pending', paymentStatus: 'Pending', totalAmount: 105, items: [{ orderItemId: 8001, productId: 1001, productName: 'Headphones', vendorId: 101, quantity: 1, unitPrice: 100, itemTotal: 100 }] };
const state = { vendors: [vendor], categories: [{ categoryId: 1, categoryName: 'Electronics', isActive: true }], products: [product], orders: [order] };

describe('demoVendorService', () => {
  test('returns only products owned by the selected vendor', () => {
    expect(getVendorProducts(state, 101)).toHaveLength(1);
    expect(getVendorProducts(state, 102)).toHaveLength(0);
  });

  test('creates and edits products for the current vendor', () => {
    const created = saveVendorProduct(state, 101, { productName: 'USB Hub', categoryId: '1', price: '25.5', stockQuantity: '10', discountPercent: '5' });
    expect(created.products).toHaveLength(2);
    expect(created.products[1]).toMatchObject({ vendorId: 101, businessName: vendor.businessName, price: 25.5, isActive: true });
    const edited = saveVendorProduct(created, 101, { productName: 'USB-C Hub', categoryId: '1', price: '30', stockQuantity: '12', discountPercent: '0' }, created.products[1].productId);
    expect(edited.products[1].productName).toBe('USB-C Hub');
  });

  test('rejects invalid category, price and non-owned product edits', () => {
    expect(() => saveVendorProduct(state, 101, { productName: 'Bad', categoryId: '9', price: '10', stockQuantity: '1' })).toThrow(/active product category/);
    expect(() => saveVendorProduct(state, 101, { productName: 'Bad', categoryId: '1', price: '-1', stockQuantity: '1' })).toThrow(/valid product price/);
    expect(() => saveVendorProduct(state, 102, { productName: 'Bad', categoryId: '1', price: '10', stockQuantity: '1' }, 1001)).toThrow(/not found/);
  });

  test('toggles and deletes only owned products', () => {
    expect(toggleVendorProduct(state, 101, 1001).products[0].isActive).toBe(false);
    expect(deleteVendorProduct(state, 101, 1001).products).toHaveLength(0);
    expect(() => deleteVendorProduct(state, 102, 1001)).toThrow(/not found/);
  });

  test('filters orders by vendor and updates only its order item', () => {
    expect(getVendorOrders(state, 101)).toHaveLength(1);
    expect(getVendorOrders(state, 102)).toHaveLength(0);
    const updated = updateVendorOrderItemStatus(state, 101, 8001, 'Shipped');
    expect(updated.orders[0].items[0].itemStatus).toBe('Shipped');
    expect(updated.orders[0].orderStatus).toBe('Shipped');
    expect(() => updateVendorOrderItemStatus(state, 102, 8001, 'Delivered')).toThrow(/not found/);
  });

  test('calculates vendor revenue without cancelled or refunded orders', () => {
    const revenue = getVendorRevenue(state, 101, 'monthly');
    expect(revenue.summary.totalSales).toBe(100);
    expect(revenue.summary.pendingPayments).toBe(100);
    expect(revenue.transactions).toHaveLength(1);
    const cancelled = getVendorRevenue({ ...state, orders: [{ ...order, orderStatus: 'Cancelled' }] }, 101);
    expect(cancelled.summary.totalSales).toBe(0);
  });
});
