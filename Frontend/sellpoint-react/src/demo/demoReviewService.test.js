import {
  getDemoReviewableOrderItem,
  getEligibleDemoReviewItems,
  getVendorDemoReviews,
  respondToDemoReview,
  submitDemoReview
} from './demoReviewService';

const state = {
  vendors: [
    { vendorId: 101, businessName: 'Nova Tech Store', status: 'Approved', isActive: true },
    { vendorId: 102, businessName: 'Urban Home', status: 'Approved', isActive: true }
  ],
  products: [
    { productId: 1001, productName: 'Wireless Headphones', vendorId: 101, businessName: 'Nova Tech Store' },
    { productId: 1006, productName: 'Desk Lamp', vendorId: 102, businessName: 'Urban Home' }
  ],
  orders: [
    { orderId: 5001, customerId: 301, orderStatus: 'Delivered', orderDate: '2026-03-01', items: [
      { orderItemId: 8001, productId: 1001, productName: 'Wireless Headphones', vendorId: 101, itemStatus: 'Delivered' },
      { orderItemId: 8002, productId: 1006, productName: 'Desk Lamp', vendorId: 102, itemStatus: 'Processing' }
    ] },
    { orderId: 5002, customerId: 302, orderStatus: 'Delivered', orderDate: '2026-03-02', items: [
      { orderItemId: 8003, productId: 1001, productName: 'Wireless Headphones', vendorId: 101, itemStatus: 'Delivered' }
    ] }
  ],
  reviews: [
    { reviewId: 7001, orderId: 5002, orderItemId: 8003, productId: 1001, vendorId: 101, customerId: 302, customerName: 'Daniyal Khan', rating: 5, comment: 'Great product', status: 'Approved', createdAt: '2026-03-04' },
    { reviewId: 7002, productId: 1006, vendorId: 102, customerId: 301, rating: 4, comment: 'Legacy review', status: 'Approved', createdAt: '2026-03-03' }
  ]
};
const customer = { role: 'Customer', userId: 301, displayName: 'Mariam Shah' };
const fixedDate = new Date('2026-04-01T12:00:00.000Z');

describe('demoReviewService', () => {
  test('offers only delivered purchases that have not already been reviewed', () => {
    expect(getEligibleDemoReviewItems(state, 301)).toEqual([
      expect.objectContaining({ orderId: 5001, orderItemId: 8001, productId: 1001 })
    ]);
    expect(getEligibleDemoReviewItems(state, 302)).toHaveLength(0);
    const secondDeliveredItem = { ...state, orders: [{ ...state.orders[0], items: [state.orders[0].items[0], { orderItemId: 8004, productId: 1001, productName: 'Wireless Headphones', vendorId: 101, itemStatus: 'Delivered' }] }] };
    expect(getEligibleDemoReviewItems(secondDeliveredItem, 301)).toHaveLength(2);
    expect(getDemoReviewableOrderItem(state, 301, 1001, 8001)).toMatchObject({ orderId: 5001, vendorId: 101 });
    expect(getDemoReviewableOrderItem(state, 301, 1006, 8002)).toBeNull();
    expect(getDemoReviewableOrderItem(state, 302, 1001, 8001)).toBeNull();
  });

  test('submits a verified review as pending moderation', () => {
    const updated = submitDemoReview(state, customer, 1001, 8001, 5, 'Excellent sound quality.', fixedDate);
    expect(updated.reviews[0]).toMatchObject({
      reviewId: 7003, orderId: 5001, orderItemId: 8001, productId: 1001,
      vendorId: 101, customerId: 301, rating: 5, comment: 'Excellent sound quality.',
      verifiedPurchase: true, status: 'Pending', vendorName: 'Nova Tech Store'
    });
    expect(updated.reviews[0].createdAt).toBe(fixedDate.toISOString());
    expect(state.reviews).toHaveLength(2);
  });

  test('prevents duplicate reviews and unverified purchases', () => {
    expect(() => submitDemoReview(state, customer, 1001, 8003, 5, 'Duplicate')).toThrow(/delivered, unreviewed purchase/);
    expect(() => submitDemoReview(state, customer, 1006, 8002, 4, 'Not delivered')).toThrow(/delivered, unreviewed purchase/);
    expect(() => submitDemoReview(state, { ...customer, userId: 999 }, 1001, 8001, 5, 'Not mine')).toThrow(/delivered, unreviewed purchase/);
    expect(() => submitDemoReview(state, { ...customer, role: 'Vendor' }, 1001, 8001, 5, 'Wrong role')).toThrow(/Customer demo session/);
  });

  test('validates rating and review length', () => {
    expect(() => submitDemoReview(state, customer, 1001, 8001, 0, 'Bad rating')).toThrow(/1 to 5/);
    expect(() => submitDemoReview(state, customer, 1001, 8001, 5.5, 'Bad rating')).toThrow(/1 to 5/);
    expect(() => submitDemoReview(state, customer, 1001, 8001, 5, 'x'.repeat(1001))).toThrow(/1,000 characters/);
  });

  test('lists vendor reviews by product ownership, including legacy review records', () => {
    expect(getVendorDemoReviews(state, 101).map(review => review.reviewId)).toEqual([7001]);
    expect(getVendorDemoReviews(state, 102).map(review => review.reviewId)).toEqual([7002]);
    expect(getVendorDemoReviews(state, 999)).toEqual([]);
  });

  test('allows the owning active vendor to respond only to approved reviews', () => {
    const approvedState = { ...state, reviews: [...state.reviews, {
      reviewId: 7003, orderItemId: 8001, productId: 1001, vendorId: 101,
      customerId: 301, rating: 4, status: 'Approved', comment: 'Good', createdAt: '2026-03-05'
    }] };
    const updated = respondToDemoReview(approvedState, 101, 7003, 'Thank you for your feedback.', fixedDate);
    expect(updated.reviews.find(review => review.reviewId === 7003).vendorResponse).toEqual({
      comment: 'Thank you for your feedback.',
      vendorName: 'Nova Tech Store',
      respondedAt: fixedDate.toISOString()
    });
    expect(() => respondToDemoReview(state, 101, 7001, 'Reply')).toThrow(/after the review is approved/);
    expect(() => respondToDemoReview(approvedState, 102, 7003, 'Wrong vendor')).toThrow(/does not belong/);
    expect(() => respondToDemoReview({ ...approvedState, vendors: [{ ...state.vendors[0], isActive: false }] }, 101, 7003, 'Reply')).toThrow(/approved and active/);
    expect(() => respondToDemoReview(approvedState, 101, 7003, '  ')).toThrow(/Enter a response/);
    expect(() => respondToDemoReview(approvedState, 101, 7003, 'x'.repeat(1001))).toThrow(/1,000 characters/);
  });
});
