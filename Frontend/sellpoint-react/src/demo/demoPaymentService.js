const roundMoney = value => Number(Number(value || 0).toFixed(2));
const nextPaymentId = payments => Math.max(20000, ...(payments || []).map(item => Number(item.paymentId) || 0)) + 1;

export const createDemoPayment = (order, payments = [], now = new Date()) => ({
  paymentId: nextPaymentId(payments),
  orderId: Number(order.orderId),
  customerId: Number(order.customerId),
  amount: roundMoney(order.totalAmount),
  currency: 'USD',
  method: order.paymentMethod || 'Cash on delivery',
  status: 'Pending',
  refundedAmount: 0,
  refundStatus: 'Not refunded',
  refunds: [],
  createdAt: new Date(now).toISOString(),
  paidAt: null
});

export const simulateDemoCardPayment = (demoState, orderId, customerId, outcome, now = new Date()) => {
  if (!['Success', 'Failure'].includes(outcome)) throw new Error('Choose a valid payment outcome.');
  const order = (demoState.orders || []).find(item => Number(item.orderId) === Number(orderId) && Number(item.customerId) === Number(customerId));
  if (!order) throw new Error('Order not found.');
  if (order.paymentMethod !== 'Demo Card (no charge)') throw new Error('Only simulated card payments can be completed here.');
  const payment = (demoState.payments || []).find(item => Number(item.orderId) === Number(orderId));
  if (!payment || payment.status !== 'Pending') throw new Error('This payment is no longer awaiting a result.');

  const timestamp = new Date(now).toISOString();
  const succeeded = outcome === 'Success';
  const payments = demoState.payments.map(item => Number(item.paymentId) === Number(payment.paymentId)
    ? { ...item, status: succeeded ? 'Paid' : 'Failed', paidAt: succeeded ? timestamp : null, updatedAt: timestamp,
        transactions: [...(item.transactions || []), { type: succeeded ? 'Payment successful' : 'Payment failed', amount: item.amount, createdAt: timestamp }] }
    : item);
  const updatedOrder = { ...order, paymentStatus: succeeded ? 'Paid' : 'Failed', orderStatus: succeeded ? 'Processing' : 'Cancelled',
    paymentCompletedAt: succeeded ? timestamp : null };

  let products = demoState.products;
  if (!succeeded) {
    products = demoState.products.map(product => {
      const lines = (order.items || []).filter(line => Number(line.productId) === Number(product.productId));
      if (!lines.length) return product;
      if (lines.some(line => line.variantId != null)) {
        const variants = (product.variants || []).map(variant => {
          const quantity = lines.filter(line => Number(line.variantId) === Number(variant.variantId)).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
          return quantity ? { ...variant, stockQuantity: Number(variant.stockQuantity || 0) + quantity } : variant;
        });
        return { ...product, variants, stockQuantity: variants.reduce((sum, variant) => sum + Number(variant.stockQuantity || 0), 0) };
      }
      return { ...product, stockQuantity: Number(product.stockQuantity || 0) + lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0) };
    });
  }

  return {
    ...demoState,
    products,
    payments,
    orders: demoState.orders.map(item => Number(item.orderId) === Number(orderId) ? updatedOrder : item)
  };
};

export const recordDemoRefund = (demoState, orderId, amount, reference, now = new Date()) => {
  const payment = (demoState.payments || []).find(item => Number(item.orderId) === Number(orderId));
  if (!payment) throw new Error('The original payment record could not be found.');
  if (!['Paid', 'Partially Refunded'].includes(payment.status)) throw new Error('Only a captured payment can be refunded.');
  const refundAmount = roundMoney(amount);
  const remaining = roundMoney(Number(payment.amount) - Number(payment.refundedAmount || 0));
  if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > remaining) {
    throw new Error(`Refund amount must be greater than zero and no more than ${remaining.toFixed(2)}.`);
  }
  const timestamp = new Date(now).toISOString();
  const refund = { refundId: Math.max(30000, ...(payment.refunds || []).map(item => Number(item.refundId) || 0)) + 1,
    reference: String(reference), amount: refundAmount, status: 'Simulated', createdAt: timestamp };
  const refundedAmount = roundMoney(Number(payment.refundedAmount || 0) + refundAmount);
  const fullyRefunded = refundedAmount >= Number(payment.amount);
  const updatedPayment = { ...payment, refundedAmount, refundStatus: fullyRefunded ? 'Refunded' : 'Partially refunded',
    status: fullyRefunded ? 'Refunded' : 'Partially Refunded', refunds: [...(payment.refunds || []), refund],
    transactions: [...(payment.transactions || []), { type: 'Simulated refund', amount: refundAmount, createdAt: timestamp }] };
  return { ...demoState, payments: demoState.payments.map(item => Number(item.paymentId) === Number(payment.paymentId) ? updatedPayment : item) };
};


export const recordDemoCashCollection = (demoState, orderId, now = new Date()) => {
  const order = (demoState.orders || []).find(item => Number(item.orderId) === Number(orderId));
  const payment = (demoState.payments || []).find(item => Number(item.orderId) === Number(orderId));
  if (!order || !payment) throw new Error('Order payment record not found.');
  if (!['CashOnDelivery', 'Cash on delivery'].includes(payment.method)) throw new Error('This order does not use cash on delivery.');
  if (payment.status !== 'Pending') throw new Error('This cash payment is no longer awaiting collection.');
  if (order.orderStatus !== 'Delivered') throw new Error('Cash can be marked as collected only after the order is delivered.');
  const timestamp = new Date(now).toISOString();
  return {
    ...demoState,
    payments: demoState.payments.map(item => Number(item.paymentId) === Number(payment.paymentId)
      ? { ...item, status: 'Paid', paidAt: timestamp, updatedAt: timestamp,
          transactions: [...(item.transactions || []), { type: 'Cash collected on delivery', amount: item.amount, createdAt: timestamp }] }
      : item),
    orders: demoState.orders.map(item => Number(item.orderId) === Number(orderId) ? { ...item, paymentStatus: 'Paid' } : item)
  };
};

export const getOrderDemoPayment = (demoState, orderId, customerId) =>
  (demoState.payments || []).find(item => Number(item.orderId) === Number(orderId) &&
    (customerId == null || Number(item.customerId) === Number(customerId))) || null;
