import { isPublicDemoProduct } from '../services/catalogService';
import { createDemoPayment, recordDemoRefund } from './demoPaymentService';

export const DEMO_CART_KEY = 'sellpoint_demo_cart_v1';

export const calculateDemoCartSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0);
  const vendorCount = new Set(items.map(item => item.vendorId || item.vendorName)).size;
  const shipping = vendorCount * 5;
  const tax = subtotal * 0.1;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number((subtotal + shipping + tax).toFixed(2)),
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    vendorCount
  };
};

export const buildDemoOrder = (demoState, session, cartItems, address, paymentMethod, date = new Date()) => {
  if (!session || session.role !== 'Customer') throw new Error('A Customer demo session is required.');
  if (!cartItems.length) throw new Error('Your cart is empty.');

  const products = demoState.products.map(product => ({ ...product, variants: (product.variants || []).map(variant => ({ ...variant, options: { ...(variant.options || {}) } })) }));
  const orderItems = cartItems.map((cartItem, index) => {
    const product = products.find(item => item.productId === cartItem.productId && isPublicDemoProduct(demoState, item));
    if (!product) throw new Error(`${cartItem.productName} is no longer available.`);

    let variant = null;
    if (Array.isArray(product.variants) && product.variants.length) {
      variant = product.variants.find(item => Number(item.variantId) === Number(cartItem.variantId));
      if (!variant) throw new Error(`Please select an available option for ${product.productName} again.`);
      if (variant.stockQuantity < cartItem.quantity) {
        throw new Error(`Only ${variant.stockQuantity} unit(s) of ${product.productName} (${variant.variantName}) remain in stock.`);
      }
      variant.stockQuantity -= cartItem.quantity;
      product.stockQuantity = product.variants.reduce((sum, item) => sum + Number(item.stockQuantity || 0), 0);
    } else {
      if (product.stockQuantity < cartItem.quantity) {
        throw new Error(`Only ${product.stockQuantity} unit(s) of ${product.productName} remain in stock.`);
      }
      product.stockQuantity -= cartItem.quantity;
    }

    const basePrice = Number(variant?.price ?? product.price);
    const unitPrice = Number((basePrice * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
    return {
      orderItemId: Math.max(0, ...demoState.orders.flatMap(order => (order.items || []).map(item => item.orderItemId || 0))) + index + 1,
      productId: product.productId,
      productName: product.productName,
      vendorId: product.vendorId,
      vendorName: product.businessName,
      variantId: variant?.variantId ?? null,
      variantName: variant?.variantName ?? null,
      variantOptions: variant?.options ?? null,
      quantity: cartItem.quantity,
      unitPrice,
      itemTotal: Number((unitPrice * cartItem.quantity).toFixed(2)),
      imageUrl: product.imageUrl || null
    };
  });

  const subtotal = Number(orderItems.reduce((sum, item) => sum + item.itemTotal, 0).toFixed(2));
  const vendorCount = new Set(orderItems.map(item => item.vendorId)).size;
  const shipping = vendorCount * 5;
  const tax = Number((subtotal * 0.1).toFixed(2));
  const orderId = Math.max(5000, ...demoState.orders.map(order => Number(order.orderId) || 0)) + 1;
  const order = {
    orderId,
    customerId: session.userId,
    customerName: session.displayName,
    orderDate: date.toISOString(),
    orderStatus: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: paymentMethod === 'DemoCard' ? 'Demo Card (no charge)' : 'CashOnDelivery',
    subtotal,
    shipping,
    tax,
    totalAmount: Number((subtotal + shipping + tax).toFixed(2)),
    addressId: address.addressId ?? null,
    recipientName: address.recipientName || session.displayName,
    recipientPhone: address.phone || '',
    shippingAddressSnapshot: { ...address },
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || '',
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country || 'Pakistan',
    shippingAddress: [address.addressLine1, address.addressLine2, address.city, address.state, address.zipCode, address.country || 'Pakistan'].filter(Boolean).join(', '),
    items: orderItems
  };

  const payment = createDemoPayment(order, demoState.payments || [], date);
  return {
    order,
    payment,
    nextState: {
      ...demoState,
      products,
      orders: [order, ...demoState.orders],
      payments: [payment, ...(demoState.payments || [])]
    }
  };
};

export const cancelDemoOrder = (demoState, orderId, customerId) => {
  const order = demoState.orders.find(item => String(item.orderId) === String(orderId) && item.customerId === customerId);
  if (!order) throw new Error('Order not found.');
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) throw new Error('Only pending or confirmed orders can be cancelled.');

  const cancelledOrder = { ...order, orderStatus: 'Cancelled', paymentStatus: order.paymentStatus === 'Paid' ? 'Refunded' : order.paymentStatus };
  const products = demoState.products.map(product => {
    const cancelledItems = (order.items || []).filter(item => item.productId === product.productId);
    if (!cancelledItems.length) return product;
    const variants = (product.variants || []).map(variant => {
      const quantity = cancelledItems
        .filter(item => Number(item.variantId) === Number(variant.variantId))
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return quantity ? { ...variant, stockQuantity: Number(variant.stockQuantity || 0) + quantity } : variant;
    });
    const variantRestock = cancelledItems.some(item => item.variantId != null);
    const plainQuantity = variantRestock ? 0 : cancelledItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return variantRestock
      ? { ...product, variants, stockQuantity: variants.reduce((sum, item) => sum + Number(item.stockQuantity || 0), 0) }
      : { ...product, stockQuantity: Number(product.stockQuantity || 0) + plainQuantity };
  });
  const payments = (demoState.payments || []).map(payment => Number(payment.orderId) === Number(order.orderId) && payment.status === 'Pending'
    ? { ...payment, status: 'Cancelled', updatedAt: new Date().toISOString() }
    : payment);
  let nextState = {
    ...demoState,
    products,
    payments,
    orders: demoState.orders.map(item => item.orderId === order.orderId ? cancelledOrder : item)
  };
  const linkedPayment = (demoState.payments || []).find(item => Number(item.orderId) === Number(order.orderId));
  if (linkedPayment && ['Paid', 'Partially Refunded'].includes(linkedPayment.status)) {
    const remainingRefund = Number((Number(linkedPayment.amount) - Number(linkedPayment.refundedAmount || 0)).toFixed(2));
    if (remainingRefund > 0) nextState = recordDemoRefund(nextState, order.orderId, remainingRefund, `cancellation-${order.orderId}`);
  }
  return nextState;
};

export const addDemoDispute = (demoState, orderId, customerId, reason) => {
  const order = demoState.orders.find(item => String(item.orderId) === String(orderId) && item.customerId === customerId);
  if (!order) throw new Error('Order not found.');
  if (!reason.trim()) throw new Error('Please enter a reason for the dispute.');
  if (demoState.disputes.some(item => item.orderId === order.orderId && item.customerId === customerId && item.status !== 'Resolved')) {
    throw new Error('An open dispute already exists for this order.');
  }
  const disputeId = Math.max(9000, ...demoState.disputes.map(item => Number(item.disputeId) || 0)) + 1;
  return {
    ...demoState,
    disputes: [{
      disputeId,
      orderId: order.orderId,
      customerId,
      reason: reason.trim(),
      status: 'Open',
      createdAt: new Date().toISOString()
    }, ...demoState.disputes]
  };
};
