import { calculateCouponDiscount, normalizeCouponCode, redeemDemoCoupon, releaseDemoCoupon, saveDemoCoupon, toggleDemoCouponActive, validateDemoCoupon } from './demoCouponService';

const state = { coupons: [{ couponId: 1, code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minimumSubtotal: 50, startsAt: '2026-01-01', expiresAt: '2026-12-31', usageLimit: 3, perCustomerLimit: 1, usageCount: 0, redemptions: [], isActive: true }] };
const now = new Date('2026-11-27T12:00:00');

describe('demoCouponService', () => {
  test('normalizes coupon codes and calculates percentage and capped fixed discounts', () => {
    expect(normalizeCouponCode(' welcome10 ')).toBe('WELCOME10');
    expect(calculateCouponDiscount(state.coupons[0], 200)).toBe(20);
    expect(calculateCouponDiscount({ discountType: 'fixed', discountValue: 90 }, 40)).toBe(40);
  });
  test('validates a valid code case-insensitively', () => {
    expect(validateDemoCoupon(state, ' welcome10 ', 301, 100, now)).toMatchObject({ valid: true, code: 'WELCOME10', discountAmount: 10 });
  });
  test('rejects unknown, inactive, future, expired and below-minimum coupons', () => {
    expect(validateDemoCoupon(state, 'NOPE', 301, 100, now).valid).toBe(false);
    expect(validateDemoCoupon({ coupons: [{ ...state.coupons[0], isActive: false }] }, 'WELCOME10', 301, 100, now).message).toMatch(/inactive/);
    expect(validateDemoCoupon({ coupons: [{ ...state.coupons[0], startsAt: '2027-01-01' }] }, 'WELCOME10', 301, 100, now).message).toMatch(/not active yet/);
    expect(validateDemoCoupon({ coupons: [{ ...state.coupons[0], expiresAt: '2026-01-01' }] }, 'WELCOME10', 301, 100, now).message).toMatch(/expired/);
    expect(validateDemoCoupon(state, 'WELCOME10', 301, 20, now).message).toMatch(/at least/);
  });
  test('keeps a coupon valid through the end of its expiry date', () => {
    const expiresToday = { coupons: [{ ...state.coupons[0], expiresAt: '2026-11-27' }] };
    expect(validateDemoCoupon(expiresToday, 'WELCOME10', 301, 100, new Date('2026-11-27T23:59:00')).valid).toBe(true);
    expect(validateDemoCoupon(expiresToday, 'WELCOME10', 301, 100, new Date('2026-11-28T00:00:00')).valid).toBe(false);
  });
  test('enforces total and per-customer usage limits', () => {
    const used = { coupons: [{ ...state.coupons[0], usageCount: 3 }] };
    expect(validateDemoCoupon(used, 'WELCOME10', 301, 100, now).message).toMatch(/total usage/);
    const customerUsed = { coupons: [{ ...state.coupons[0], usageCount: 1, redemptions: [{ orderId: 1, customerId: 301 }] }] };
    expect(validateDemoCoupon(customerUsed, 'WELCOME10', 301, 100, now).message).toMatch(/customer/);
  });
  test('creates, edits, validates and deactivates coupon records', () => {
    const added = saveDemoCoupon({ coupons: [] }, { code: 'SAVE15', discountType: 'percentage', discountValue: 15, minimumSubtotal: 0 });
    expect(added.coupons[0]).toMatchObject({ code: 'SAVE15', isActive: true, usageCount: 0 });
    expect(() => saveDemoCoupon(added, { code: 'save15', discountType: 'fixed', discountValue: 5 })).toThrow(/already exists/);
    const edited = saveDemoCoupon(added, { code: 'SAVE15', discountType: 'fixed', discountValue: 5 }, added.coupons[0].couponId);
    expect(edited.coupons[0]).toMatchObject({ discountType: 'fixed', discountValue: 5 });
    expect(toggleDemoCouponActive(edited, edited.coupons[0].couponId).coupons[0].isActive).toBe(false);
  });
  test('records a redemption once and releases it when an order is cancelled or payment fails', () => {
    const redeemed = redeemDemoCoupon(state, state.coupons[0], 5001, 301);
    expect(redeemed.coupons[0].usageCount).toBe(1);
    expect(() => redeemDemoCoupon(redeemed, redeemed.coupons[0], 5001, 301)).toThrow(/already used/);
    const released = releaseDemoCoupon({ ...redeemed, orders: [{ orderId: 5001, couponCode: 'WELCOME10' }] }, { orderId: 5001, couponCode: 'WELCOME10' });
    expect(released.coupons[0].usageCount).toBe(0);
    expect(released.coupons[0].redemptions).toHaveLength(0);
  });
});
