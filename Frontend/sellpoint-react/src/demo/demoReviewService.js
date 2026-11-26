const normalizeText = value => String(value ?? '').trim();

const findOrderItem = (state, customerId, productId, orderItemId) => {
  const order = state.orders.find(item => item.customerId === Number(customerId) &&
    (item.items || []).some(line => Number(line.orderItemId) === Number(orderItemId)));
  if (!order) return null;
  const item = order.items.find(line => Number(line.orderItemId) === Number(orderItemId));
  if (Number(item.productId) !== Number(productId)) return null;
  return { order, item };
};

const isDelivered = (order, item) => (item.itemStatus || order.orderStatus) === 'Delivered';

export const getEligibleDemoReviewItems = (state, customerId) => {
  const reviewedItemIds = new Set((state.reviews || []).map(review => Number(review.orderItemId)).filter(Number.isFinite));
  return state.orders
    .filter(order => order.customerId === Number(customerId))
    .flatMap(order => (order.items || [])
      .filter(item => isDelivered(order, item) && !reviewedItemIds.has(Number(item.orderItemId)))
      .map(item => ({
        orderId: order.orderId,
        orderItemId: item.orderItemId,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName || null,
        vendorId: item.vendorId,
        orderDate: order.orderDate
      })));
};

export const getDemoReviewableOrderItem = (state, customerId, productId, orderItemId) => {
  const match = findOrderItem(state, customerId, productId, orderItemId);
  if (!match || !isDelivered(match.order, match.item)) return null;
  const alreadyReviewed = (state.reviews || []).some(review => Number(review.orderItemId) === Number(orderItemId));
  if (alreadyReviewed) return null;
  return {
    orderId: match.order.orderId,
    orderItemId: match.item.orderItemId,
    productId: match.item.productId,
    productName: match.item.productName,
    variantName: match.item.variantName || null,
    vendorId: match.item.vendorId
  };
};

export const submitDemoReview = (state, session, productId, orderItemId, rating, comment, date = new Date()) => {
  if (!session || session.role !== 'Customer') throw new Error('A Customer demo session is required.');
  const purchase = getDemoReviewableOrderItem(state, session.userId, productId, orderItemId);
  if (!purchase) throw new Error('A delivered, unreviewed purchase of this product is required.');
  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Choose a rating from 1 to 5 stars.');
  const text = normalizeText(comment);
  if (text.length > 1000) throw new Error('Your review must be 1,000 characters or fewer.');

  const product = state.products.find(item => item.productId === Number(productId));
  const vendor = state.vendors.find(item => item.vendorId === purchase.vendorId);
  const nextId = Math.max(7000, ...(state.reviews || []).map(item => Number(item.reviewId) || 0)) + 1;
  const review = {
    reviewId: nextId,
    orderId: purchase.orderId,
    orderItemId: purchase.orderItemId,
    productId: purchase.productId,
    productName: product?.productName || purchase.productName,
    vendorId: purchase.vendorId,
    vendorName: vendor?.businessName || product?.businessName || 'SellPoint vendor',
    customerId: Number(session.userId),
    customerName: session.displayName || 'Demo customer',
    rating: score,
    comment: text,
    verifiedPurchase: true,
    status: 'Pending',
    moderationReason: '',
    vendorResponse: null,
    createdAt: date.toISOString()
  };
  return { ...state, reviews: [review, ...(state.reviews || [])] };
};

export const getVendorDemoReviews = (state, vendorId) => (state.reviews || [])
  .filter(review => {
    const product = state.products.find(item => item.productId === review.productId);
    return Number(review.vendorId ?? product?.vendorId) === Number(vendorId);
  })
  .map(review => ({ ...review }))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const respondToDemoReview = (state, vendorId, reviewId, response, date = new Date()) => {
  const vendor = state.vendors.find(item => item.vendorId === Number(vendorId));
  if (!vendor || vendor.status !== 'Approved' || !vendor.isActive) {
    throw new Error('Only approved and active vendors can respond to reviews.');
  }
  const review = (state.reviews || []).find(item => Number(item.reviewId) === Number(reviewId));
  if (!review) throw new Error('Review not found.');
  const product = state.products.find(item => item.productId === review.productId);
  if (Number(review.vendorId ?? product?.vendorId) !== Number(vendorId)) {
    throw new Error('This review does not belong to your store.');
  }
  if (review.status !== 'Approved') throw new Error('You can respond after the review is approved by an admin.');
  const text = normalizeText(response);
  if (!text) throw new Error('Enter a response before saving.');
  if (text.length > 1000) throw new Error('Your response must be 1,000 characters or fewer.');
  return {
    ...state,
    reviews: state.reviews.map(item => item.reviewId === review.reviewId
      ? { ...item, vendorResponse: { comment: text, vendorName: vendor.businessName, respondedAt: date.toISOString() } }
      : item)
  };
};
