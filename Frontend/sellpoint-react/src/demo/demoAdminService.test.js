import { getAdminOverview, getAdminReport, getAdminTopProducts, getAdminTopVendors, moderateAdminProduct, moderateAdminReview, saveAdminCategory, toggleCategoryActive, toggleVendorActive, updateAdminDispute, updateAdminOrderStatus, updateVendorApproval } from './demoAdminService';
import { createDemoState } from './demoSeedData';

describe('demoAdminService', () => {
  let state;
  beforeEach(() => { state = createDemoState(); });

  test('calculates marketplace overview counts and revenue', () => {
    const overview = getAdminOverview(state);
    expect(overview.totalCustomers).toBe(4);
    expect(overview.totalVendors).toBe(6);
    expect(overview.totalProducts).toBe(32);
    expect(overview.pendingVendors).toBe(1);
    expect(overview.pendingReviews).toBe(4);
    expect(overview.pendingProducts).toBe(1);
  });

  test('approves, rejects and suspends vendors', () => {
    const approved = updateVendorApproval(state, 104, 'Approved');
    expect(approved.vendors.find(v => v.vendorId === 104)).toMatchObject({ status: 'Approved', isActive: true });
    const rejected = updateVendorApproval(state, 104, 'Rejected');
    expect(rejected.vendors.find(v => v.vendorId === 104).isActive).toBe(false);
    const suspended = toggleVendorActive(state, 101);
    expect(suspended.vendors.find(v => v.vendorId === 101).isActive).toBe(false);
  });

  test('approves and rejects pending product listings', () => {
    const pending = state.products.find(product => product.moderationStatus === 'Pending');
    const approved = moderateAdminProduct(state, pending.productId, 'Approved');
    expect(approved.products.find(product => product.productId === pending.productId)).toMatchObject({ moderationStatus: 'Approved', isActive: true, moderationReason: '' });

    const rejectedProduct = state.products.find(product => product.moderationStatus === 'Pending');
    const rejected = moderateAdminProduct(state, rejectedProduct.productId, 'Rejected', 'Please improve the photos.');
    expect(rejected.products.find(product => product.productId === rejectedProduct.productId)).toMatchObject({ moderationStatus: 'Rejected', isActive: false, moderationReason: 'Please improve the photos.' });
    expect(() => moderateAdminProduct(state, rejectedProduct.productId, 'Rejected')).toThrow(/reason/);
    expect(() => moderateAdminProduct(approved, pending.productId, 'Rejected', 'Duplicate')).toThrow(/Only pending/);
  });

  test('creates, edits and validates categories', () => {
    const added = saveAdminCategory(state, { categoryName: 'Garden', description: 'Outdoor goods' });
    expect(added.categories).toHaveLength(9);
    expect(added.categories[8].categoryName).toBe('Garden');
    expect(() => saveAdminCategory(state, { categoryName: 'electronics' })).toThrow(/already exists/);
    const edited = saveAdminCategory(added, { categoryName: 'Garden & Patio', description: 'Outdoor goods' }, added.categories[8].categoryId);
    expect(edited.categories[8].categoryName).toBe('Garden & Patio');
  });

  test('prevents deactivating a category that has active products', () => {
    expect(() => toggleCategoryActive(state, 1)).toThrow(/active products/);
    const safeState = { ...state, products: state.products.map(p => p.categoryId === 1 ? { ...p, isActive: false } : p) };
    expect(toggleCategoryActive(safeState, 1).categories[0].isActive).toBe(false);
  });

  test('updates order and item statuses together', () => {
    const updated = updateAdminOrderStatus(state, 5001, 'Shipped');
    expect(updated.orders[0].orderStatus).toBe('Shipped');
    expect(updated.orders[0].items[0].itemStatus).toBe('Shipped');
    expect(() => updateAdminOrderStatus(state, 9999, 'Shipped')).toThrow(/not found/);
  });

  test('records dispute decisions with notes', () => {
    const updated = updateAdminDispute(state, 9001, 'Resolved', 'Refund approved in demo.');
    expect(updated.disputes[0]).toMatchObject({ status: 'Resolved', adminNotes: 'Refund approved in demo.' });
    expect(() => updateAdminDispute(state, 9001, 'Resolved', '  ')).toThrow(/admin note/);
  });

  test('approves, rejects and removes reviews from public display', () => {
    const pending = state.reviews.find(r => r.status === 'Pending');
    const approved = moderateAdminReview(state, pending.reviewId, 'Approved');
    expect(approved.reviews.find(r => r.reviewId === pending.reviewId).status).toBe('Approved');
    const rejected = moderateAdminReview(state, pending.reviewId, 'Rejected', 'Please remove personal information.');
    expect(rejected.reviews.find(r => r.reviewId === pending.reviewId)).toMatchObject({ status: 'Rejected', moderationReason: 'Please remove personal information.' });
    const removed = moderateAdminReview(approved, pending.reviewId, 'Removed');
    expect(removed.reviews.find(r => r.reviewId === pending.reviewId).status).toBe('Removed');
    expect(() => moderateAdminReview(approved, pending.reviewId, 'Rejected')).toThrow(/Only pending/);
  });

  test('creates date-grouped reports and top product/vendor summaries', () => {
    const report = getAdminReport(state, '2026-01-01', '2026-12-31', 'monthly');
    expect(report.length).toBeGreaterThan(0);
    expect(report.every(row => row.totalOrders > 0)).toBe(true);
    expect(getAdminTopProducts(state).length).toBeGreaterThan(0);
    expect(getAdminTopVendors(state).length).toBeGreaterThan(0);
  });
});
