import { recordDemoRefund } from './demoPaymentService';

const RETURN_WINDOW_DAYS = 30;

const nextId = (requests) => Math.max(10000, ...requests.map(item => Number(item.returnId) || 0)) + 1;
const roundMoney = value => Number(Number(value || 0).toFixed(2));

export const getReturnEligibility = (demoState, orderId, orderItemId, customerId, now = new Date()) => {
  const order = demoState.orders.find(item => String(item.orderId) === String(orderId) && Number(item.customerId) === Number(customerId));
  if (!order) return { eligible: false, reason: 'Order not found.' };
  const item = (order.items || []).find(entry => String(entry.orderItemId) === String(orderItemId));
  if (!item) return { eligible: false, reason: 'Order item not found.' };
  const deliveredAt = item.deliveredAt || order.deliveredAt;
  const status = item.itemStatus || order.orderStatus;
  if (status !== 'Delivered' || !deliveredAt) return { eligible: false, reason: 'Only delivered items can be returned.' };
  const deliveredDate = new Date(deliveredAt);
  if (Number.isNaN(deliveredDate.getTime())) return { eligible: false, reason: 'The delivery date is unavailable.' };
  const elapsedMs = new Date(now).getTime() - deliveredDate.getTime();
  if (elapsedMs < 0) return { eligible: false, reason: 'The delivery date is in the future.' };
  if (elapsedMs > RETURN_WINDOW_DAYS * 86400000) return { eligible: false, reason: 'The 30-day return window has expired.' };
  const ageDays = Math.floor(elapsedMs / 86400000);
  if ((demoState.returnRequests || []).some(request => Number(request.orderItemId) === Number(orderItemId))) {
    return { eligible: false, reason: 'A return request already exists for this order item.' };
  }
  return { eligible: true, order, item, deliveredAt, daysRemaining: RETURN_WINDOW_DAYS - ageDays };
};

export const createDemoReturnRequest = (demoState, { orderId, orderItemId, customerId, quantity, reason }, now = new Date()) => {
  const eligibility = getReturnEligibility(demoState, orderId, orderItemId, customerId, now);
  if (!eligibility.eligible) throw new Error(eligibility.reason);
  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > Number(eligibility.item.quantity)) {
    throw new Error(`Return quantity must be a whole number between 1 and ${eligibility.item.quantity}.`);
  }
  if (!String(reason || '').trim()) throw new Error('Please provide a reason for the return.');
  const product = demoState.products.find(entry => Number(entry.productId) === Number(eligibility.item.productId));
  const vendor = demoState.vendors.find(entry => Number(entry.vendorId) === Number(eligibility.item.vendorId));
  if (!product || !vendor) throw new Error('The product or vendor record could not be found.');
  const requests = demoState.returnRequests || [];
  const request = {
    returnId: nextId(requests),
    orderId: eligibility.order.orderId,
    orderItemId: eligibility.item.orderItemId,
    customerId: Number(customerId),
    customerName: eligibility.order.customerName,
    vendorId: Number(eligibility.item.vendorId),
    vendorName: eligibility.item.vendorName || vendor.businessName,
    productId: Number(eligibility.item.productId),
    productName: eligibility.item.productName,
    variantId: eligibility.item.variantId ?? null,
    variantName: eligibility.item.variantName || null,
    purchasedQuantity: Number(eligibility.item.quantity),
    quantity: requestedQuantity,
    unitPrice: roundMoney(Number(eligibility.item.itemTotal ?? (Number(eligibility.item.unitPrice) * Number(eligibility.item.quantity))) / Number(eligibility.item.quantity)),
    refundAmount: roundMoney((Number(eligibility.item.itemTotal ?? (Number(eligibility.item.unitPrice) * Number(eligibility.item.quantity))) / Number(eligibility.item.quantity)) * requestedQuantity),
    reason: String(reason).trim(),
    status: 'Pending Vendor Review',
    createdAt: new Date(now).toISOString(),
    vendorDecision: null,
    adminDecision: null,
    refundStatus: 'Not processed',
    restocked: false
  };
  return { ...demoState, returnRequests: [request, ...requests] };
};

export const decideDemoReturnAsVendor = (demoState, returnId, vendorId, decision, { restock = false, notes = '' } = {}, now = new Date()) => {
  const request = (demoState.returnRequests || []).find(entry => Number(entry.returnId) === Number(returnId));
  if (!request || Number(request.vendorId) !== Number(vendorId)) throw new Error('Return request not found for this vendor.');
  if (request.status !== 'Pending Vendor Review') throw new Error('This return request is no longer awaiting vendor review.');
  if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Choose a valid vendor decision.');
  const updated = {
    ...request,
    status: decision,
    vendorDecision: { decision, notes: String(notes || '').trim(), decidedAt: new Date(now).toISOString(), restock: decision === 'Approved' && Boolean(restock) }
  };
  if (decision === 'Approved') {
    updated.refundStatus = request.refundAmount > 0 ? 'Simulated refund recorded' : 'No refund due';
    updated.refundedAt = new Date(now).toISOString();
    updated.restocked = false;
  }
  let next = { ...demoState, returnRequests: demoState.returnRequests.map(entry => entry.returnId === request.returnId ? updated : entry) };
  if (decision === 'Approved' && request.refundAmount > 0) next = recordDemoRefund(next, request.orderId, request.refundAmount, `return-${request.returnId}`, now);
  return decision === 'Approved' && restock ? restockReturnedItem(next, updated) : next;
};

export const escalateDemoReturn = (demoState, returnId, customerId, explanation = '', now = new Date()) => {
  const request = (demoState.returnRequests || []).find(entry => Number(entry.returnId) === Number(returnId) && Number(entry.customerId) === Number(customerId));
  if (!request) throw new Error('Return request not found.');
  if (request.status !== 'Rejected') throw new Error('Only a vendor-rejected request can be escalated.');
  const updated = { ...request, status: 'Escalated', escalation: { explanation: String(explanation || '').trim(), createdAt: new Date(now).toISOString() } };
  return { ...demoState, returnRequests: demoState.returnRequests.map(entry => entry.returnId === request.returnId ? updated : entry) };
};

const restockReturnedItem = (demoState, request) => {
  if (request.restocked) return demoState;
  const product = demoState.products.find(entry => Number(entry.productId) === Number(request.productId));
  if (!product) throw new Error('The product for this return could not be found.');
  let products;
  if (request.variantId != null) {
    const variants = (product.variants || []).map(variant => Number(variant.variantId) === Number(request.variantId)
      ? { ...variant, stockQuantity: Number(variant.stockQuantity || 0) + Number(request.quantity) }
      : variant);
    if (!variants.some(variant => Number(variant.variantId) === Number(request.variantId))) throw new Error('The purchased product variant could not be found.');
    products = demoState.products.map(entry => entry.productId === product.productId
      ? { ...entry, variants, stockQuantity: variants.reduce((sum, variant) => sum + Number(variant.stockQuantity || 0), 0) }
      : entry);
  } else {
    products = demoState.products.map(entry => entry.productId === product.productId
      ? { ...entry, stockQuantity: Number(entry.stockQuantity || 0) + Number(request.quantity) }
      : entry);
  }
  return {
    ...demoState,
    products,
    returnRequests: demoState.returnRequests.map(entry => entry.returnId === request.returnId ? { ...entry, restocked: true, restockedAt: new Date().toISOString() } : entry)
  };
};

export const decideDemoReturnAsAdmin = (demoState, returnId, decision, { restock = false, notes = '' } = {}, now = new Date()) => {
  const request = (demoState.returnRequests || []).find(entry => Number(entry.returnId) === Number(returnId));
  if (!request || request.status !== 'Escalated') throw new Error('Only escalated return requests can receive an admin decision.');
  if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Choose a valid admin decision.');
  const updated = {
    ...request,
    status: decision === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin',
    adminDecision: { decision, notes: String(notes || '').trim(), decidedAt: new Date(now).toISOString(), restock: decision === 'Approved' && Boolean(restock) }
  };
  if (decision === 'Approved') {
    updated.refundStatus = request.refundAmount > 0 ? 'Simulated refund recorded' : 'No refund due';
    updated.refundedAt = new Date(now).toISOString();
  }
  let next = { ...demoState, returnRequests: demoState.returnRequests.map(entry => entry.returnId === request.returnId ? updated : entry) };
  if (decision === 'Approved' && request.refundAmount > 0) next = recordDemoRefund(next, request.orderId, request.refundAmount, `return-${request.returnId}`, now);
  return decision === 'Approved' && restock ? restockReturnedItem(next, updated) : next;
};

export const getCustomerDemoReturns = (demoState, customerId) =>
  (demoState.returnRequests || []).filter(item => Number(item.customerId) === Number(customerId));

export const getVendorDemoReturns = (demoState, vendorId) =>
  (demoState.returnRequests || []).filter(item => Number(item.vendorId) === Number(vendorId));
