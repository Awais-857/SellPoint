const nextId = notifications => Math.max(0, ...(notifications || []).map(item => Number(item.notificationId) || 0)) + 1;

const makeNotification = (recipientRole, recipientId, type, title, message, link, createdAt) => ({
  recipientRole, recipientId: recipientId ?? null, type, title, message, link,
  createdAt, isRead: false
});

export const createNotificationsForStateChange = (previous, next, now = new Date()) => {
  const notifications = [...(next.notifications || [])];
  const createdAt = new Date(now).toISOString();
  const pending = [];
  const add = (...args) => pending.push(makeNotification(...args, createdAt));
  const oldOrders = new Map((previous.orders || []).map(item => [Number(item.orderId), item]));
  const oldVendors = new Map((previous.vendors || []).map(item => [Number(item.vendorId), item]));
  const oldProducts = new Map((previous.products || []).map(item => [Number(item.productId), item]));
  const oldReturns = new Map((previous.returnRequests || []).map(item => [Number(item.returnId), item]));
  const oldReviews = new Map((previous.reviews || []).map(item => [Number(item.reviewId), item]));
  const oldPayments = new Map((previous.payments || []).map(item => [Number(item.paymentId), item]));

  (next.orders || []).forEach(order => {
    const old = oldOrders.get(Number(order.orderId));
    if (!old) {
      add('Customer', order.customerId, 'order-placed', 'Order placed', `Your order #${order.orderId} has been placed successfully.`, `/order-detail/${order.orderId}`);
      const payment = (next.payments || []).find(item => Number(item.orderId) === Number(order.orderId));
      const awaitingCardPayment = payment?.method === 'Demo Card (no charge)' && payment.status === 'Pending';
      if (!awaitingCardPayment) {
        [...new Set((order.items || []).map(item => Number(item.vendorId)))].forEach(vendorId => {
          add('Vendor', vendorId, 'new-order', 'New order received', `Order #${order.orderId} includes products from your store.`, '/vendor/orders');
        });
      }
      add('Admin', null, 'new-order', 'New marketplace order', `Order #${order.orderId} was placed by ${order.customerName || 'a customer'}.`, '/admin/orders');
      return;
    }
    const oldStatus = old.orderStatus;
    if (oldStatus !== order.orderStatus) {
      add('Customer', order.customerId, 'order-status', 'Order status updated', `Your order #${order.orderId} is now ${order.orderStatus}.`, `/order-detail/${order.orderId}`);
    } else {
      (order.items || []).forEach(item => {
        const oldItem = (old.items || []).find(line => Number(line.orderItemId) === Number(item.orderItemId));
        if (oldItem && oldItem.itemStatus !== item.itemStatus && item.itemStatus) {
          add('Customer', order.customerId, 'order-status', 'Order item updated', `${item.productName} in order #${order.orderId} is now ${item.itemStatus}.`, `/order-detail/${order.orderId}`);
        }
      });
    }
  });

  (next.vendors || []).forEach(vendor => {
    const old = oldVendors.get(Number(vendor.vendorId));
    if (!old) {
      if (vendor.status === 'Pending') add('Admin', null, 'vendor-application', 'New vendor application', `${vendor.businessName} submitted a vendor application.`, '/admin/vendors');
      return;
    }
    if (old.status !== vendor.status) {
      add('Vendor', vendor.vendorId, 'vendor-status', 'Vendor application updated', `Your vendor application is now ${vendor.status.toLowerCase()}.`, '/vendor-dashboard');
    }
    if (old.isActive !== vendor.isActive && vendor.status === 'Approved') {
      add('Vendor', vendor.vendorId, 'vendor-account', vendor.isActive ? 'Store activated' : 'Store suspended', vendor.isActive ? 'Your store has been activated.' : 'Your store has been suspended.', '/vendor-dashboard');
    }
  });

  (next.products || []).forEach(product => {
    const old = oldProducts.get(Number(product.productId));
    if (!old) {
      if ((product.moderationStatus || 'Approved') === 'Pending') {
        add('Vendor', product.vendorId, 'product-submitted', 'Product submitted for review', `${product.productName} is awaiting admin approval.`, '/vendor/products');
        add('Admin', null, 'product-submitted', 'Product awaiting review', `${product.productName} was submitted by ${product.businessName || 'a vendor'}.`, '/admin/products');
      }
      return;
    }
    if ((old.moderationStatus || 'Approved') !== (product.moderationStatus || 'Approved')) {
      add('Vendor', product.vendorId, 'product-moderation', 'Product review completed', `${product.productName} was ${String(product.moderationStatus).toLowerCase()}.`, '/vendor/products');
    }
  });

  (next.returnRequests || []).forEach(request => {
    const old = oldReturns.get(Number(request.returnId));
    if (!old) {
      add('Vendor', request.vendorId, 'return-request', 'New return request', `A customer requested a return for ${request.productName} (order #${request.orderId}).`, '/vendor/returns');
      return;
    }
    if (old.status !== request.status) {
      add('Customer', request.customerId, 'return-update', 'Return request updated', `Your return request for ${request.productName} is now ${request.status.toLowerCase()}.`, '/customer/returns');
      if (request.status === 'Escalated') add('Admin', null, 'return-escalated', 'Return request escalated', `Return request #${request.returnId} needs an admin decision.`, '/admin/returns');
    }
  });

  (next.reviews || []).forEach(review => {
    const old = oldReviews.get(Number(review.reviewId));
    if (!old) {
      if (review.status === 'Pending') add('Admin', null, 'review-submitted', 'Review awaiting moderation', `${review.customerName} submitted a review for ${review.productName}.`, '/admin/reviews');
      return;
    }
    if (old.status !== review.status) {
      add('Customer', review.customerId, 'review-moderation', 'Review status updated', `Your review for ${review.productName} was ${String(review.status).toLowerCase()}.`, '/customer/reviews');
    }
  });


  (next.payments || []).forEach(payment => {
    const old = oldPayments.get(Number(payment.paymentId));
    if (!old || old.status === payment.status) return;
    if (payment.status === 'Paid') {
      add('Customer', payment.customerId, 'payment-success', 'Payment successful', `Payment for order #${payment.orderId} was successful.`, `/order-detail/${payment.orderId}`);
      add('Admin', null, 'payment-success', 'Payment received', `Payment for order #${payment.orderId} was recorded.`, '/admin/payments');
      const order = (next.orders || []).find(item => Number(item.orderId) === Number(payment.orderId));
      [...new Set((order?.items || []).map(item => Number(item.vendorId)))].forEach(vendorId => {
        add('Vendor', vendorId, 'payment-success', 'Order payment received', `Payment for order #${payment.orderId} was successful.`, '/vendor/orders');
      });
    } else if (payment.status === 'Failed') {
      add('Customer', payment.customerId, 'payment-failed', 'Payment failed', `Payment for order #${payment.orderId} failed. The order was cancelled.`, `/order-detail/${payment.orderId}`);
      add('Admin', null, 'payment-failed', 'Payment failed', `Payment for order #${payment.orderId} failed.`, '/admin/payments');
    } else if (payment.status === 'Partially Refunded' || payment.status === 'Refunded') {
      add('Customer', payment.customerId, 'payment-refund', 'Refund recorded', `A simulated refund of ${Number(payment.refunds?.[payment.refunds.length - 1]?.amount || 0).toFixed(2)} was recorded for order #${payment.orderId}.`, `/order-detail/${payment.orderId}`);
      add('Admin', null, 'payment-refund', 'Refund recorded', `A simulated refund was recorded for order #${payment.orderId}.`, '/admin/payments');
    }
  });

  if (!pending.length) return next;
  let id = nextId(notifications);
  const appended = pending.map(item => ({ ...item, notificationId: id++ }));
  return { ...next, notifications: [...appended, ...notifications] };
};

export const getDemoNotifications = (state, session) => {
  if (!session) return [];
  return (state.notifications || [])
    .filter(item => item.recipientRole === session.role &&
      (item.recipientRole === 'Admin' || Number(item.recipientId) === Number(session.vendorId ?? session.userId)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const markDemoNotificationRead = (state, notificationId, session) => {
  if (!session) return state;
  const target = (state.notifications || []).find(item => Number(item.notificationId) === Number(notificationId));
  if (!target || target.recipientRole !== session.role ||
      (target.recipientRole !== 'Admin' && Number(target.recipientId) !== Number(session.vendorId ?? session.userId))) return state;
  return { ...state, notifications: state.notifications.map(item =>
    Number(item.notificationId) === Number(notificationId) ? { ...item, isRead: true } : item
  ) };
};

export const markAllDemoNotificationsRead = (state, session) => {
  if (!session) return state;
  const recipientId = Number(session.vendorId ?? session.userId);
  return {
    ...state,
    notifications: (state.notifications || []).map(item =>
      item.recipientRole === session.role &&
      (item.recipientRole === 'Admin' || Number(item.recipientId) === recipientId)
        ? { ...item, isRead: true }
        : item
    )
  };
};
