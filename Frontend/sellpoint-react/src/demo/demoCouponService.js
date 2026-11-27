const money = value => Number(Number(value || 0).toFixed(2));
export const normalizeCouponCode = code => String(code || '').trim().toUpperCase();

export const calculateCouponDiscount = (coupon, subtotal) => {
  const amount = Math.max(0, money(subtotal));
  if (!coupon) return 0;
  const discount = coupon.discountType === 'percentage'
    ? amount * Number(coupon.discountValue || 0) / 100
    : Number(coupon.discountValue || 0);
  return money(Math.min(amount, Math.max(0, discount)));
};

export const validateDemoCoupon = (state, code, customerId, subtotal, now = new Date()) => {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { valid: false, message: 'Enter a coupon code.' };
  const coupon = (state.coupons || []).find(item => normalizeCouponCode(item.code) === normalized);
  if (!coupon) return { valid: false, message: 'This coupon code does not exist.' };
  if (!coupon.isActive) return { valid: false, message: 'This coupon is inactive.' };
  const currentDate = new Date(now);
  const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const dateOnly = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  if (coupon.startsAt && (dateOnly(coupon.startsAt) ? dateKey < coupon.startsAt : currentDate.getTime() < new Date(coupon.startsAt).getTime())) return { valid: false, message: 'This coupon is not active yet.' };
  if (coupon.expiresAt && (dateOnly(coupon.expiresAt) ? dateKey > coupon.expiresAt : currentDate.getTime() > new Date(coupon.expiresAt).getTime())) return { valid: false, message: 'This coupon has expired.' };
  const orderSubtotal = money(subtotal);
  if (orderSubtotal < Number(coupon.minimumSubtotal || 0)) return { valid: false, message: `Your subtotal must be at least $${Number(coupon.minimumSubtotal || 0).toFixed(2)}.` };
  const redemptions = coupon.redemptions || [];
  if (coupon.usageLimit != null && Number(coupon.usageCount || 0) >= Number(coupon.usageLimit)) return { valid: false, message: 'This coupon has reached its total usage limit.' };
  if (coupon.perCustomerLimit != null && redemptions.filter(item => Number(item.customerId) === Number(customerId)).length >= Number(coupon.perCustomerLimit)) return { valid: false, message: 'You have reached the per-customer usage limit for this coupon.' };
  return { valid: true, coupon, code: normalized, discountAmount: calculateCouponDiscount(coupon, orderSubtotal),
    message: coupon.discountType === 'percentage' ? `${coupon.discountValue}% discount applied.` : `$${Number(coupon.discountValue).toFixed(2)} discount applied.` };
};

export const saveDemoCoupon = (state, values, couponId = null) => {
  const code = normalizeCouponCode(values.code);
  const discountType = values.discountType;
  const discountValue = Number(values.discountValue);
  const minimumSubtotal = values.minimumSubtotal === '' || values.minimumSubtotal == null ? 0 : Number(values.minimumSubtotal);
  const usageLimit = values.usageLimit === '' || values.usageLimit == null ? null : Number(values.usageLimit);
  const perCustomerLimit = values.perCustomerLimit === '' || values.perCustomerLimit == null ? null : Number(values.perCustomerLimit);
  const startsAt = values.startsAt || '';
  const expiresAt = values.expiresAt || '';
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new Error('Use 3–24 letters, numbers, hyphens or underscores for the code.');
  if (!['percentage', 'fixed'].includes(discountType)) throw new Error('Choose a valid discount type.');
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) throw new Error('Enter a valid discount value.');
  if (!Number.isFinite(minimumSubtotal) || minimumSubtotal < 0) throw new Error('Minimum order subtotal cannot be negative.');
  if (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit < 1)) throw new Error('Total usage limit must be a positive whole number.');
  if (perCustomerLimit != null && (!Number.isInteger(perCustomerLimit) || perCustomerLimit < 1)) throw new Error('Customer usage limit must be a positive whole number.');
  if (startsAt && expiresAt && new Date(startsAt).getTime() > new Date(expiresAt).getTime()) throw new Error('Expiry date must be after the start date.');
  const duplicate = (state.coupons || []).some(item => normalizeCouponCode(item.code) === code && Number(item.couponId) !== Number(couponId));
  if (duplicate) throw new Error('A coupon with this code already exists.');
  const existing = couponId == null ? null : (state.coupons || []).find(item => Number(item.couponId) === Number(couponId));
  if (couponId != null && !existing) throw new Error('Coupon not found.');
  if (existing && Number(existing.usageCount || 0) > 0 && code !== normalizeCouponCode(existing.code)) throw new Error('A used coupon code cannot be renamed.');
  const coupon = { ...(existing || {}), couponId: existing?.couponId ?? Math.max(0, ...(state.coupons || []).map(item => Number(item.couponId) || 0)) + 1,
    code, discountType, discountValue: money(discountValue), minimumSubtotal: money(minimumSubtotal),
    startsAt, expiresAt, usageLimit, perCustomerLimit, isActive: existing ? existing.isActive : true,
    usageCount: Number(existing?.usageCount || 0), redemptions: existing?.redemptions || [] };
  return { ...state, coupons: existing
    ? state.coupons.map(item => Number(item.couponId) === Number(existing.couponId) ? coupon : item)
    : [...(state.coupons || []), coupon] };
};

export const toggleDemoCouponActive = (state, couponId) => {
  const coupon = (state.coupons || []).find(item => Number(item.couponId) === Number(couponId));
  if (!coupon) throw new Error('Coupon not found.');
  return { ...state, coupons: state.coupons.map(item => Number(item.couponId) === Number(coupon.couponId) ? { ...item, isActive: !item.isActive } : item) };
};

export const redeemDemoCoupon = (state, coupon, orderId, customerId) => {
  if (!coupon) return state;
  const current = (state.coupons || []).find(item => Number(item.couponId) === Number(coupon.couponId));
  if (!current) throw new Error('The coupon is no longer available.');
  const redemptions = current.redemptions || [];
  if (redemptions.some(item => Number(item.orderId) === Number(orderId))) throw new Error('This order has already used the coupon.');
  return { ...state, coupons: state.coupons.map(item => Number(item.couponId) === Number(current.couponId)
    ? { ...item, usageCount: Number(item.usageCount || 0) + 1, redemptions: [...redemptions, { orderId: Number(orderId), customerId: Number(customerId) }] }
    : item) };
};

export const releaseDemoCoupon = (state, order) => {
  if (!order?.couponCode || order.couponUsageReleased) return state;
  const code = normalizeCouponCode(order.couponCode);
  return { ...state, coupons: (state.coupons || []).map(coupon => {
    if (normalizeCouponCode(coupon.code) !== code) return coupon;
    const redemptions = (coupon.redemptions || []).filter(item => Number(item.orderId) !== Number(order.orderId));
    return { ...coupon, redemptions, usageCount: Math.max(0, Number(coupon.usageCount || 0) - 1) };
  }), orders: (state.orders || []).map(item => Number(item.orderId) === Number(order.orderId) ? { ...item, couponUsageReleased: true } : item) };
};
