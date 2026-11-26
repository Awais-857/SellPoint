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

  const products = demoState.products.map(product => ({ ...product }));
  const orderItems = cartItems.map((cartItem, index) => {
    const product = products.find(item => item.productId === cartItem.productId && item.isActive);
    if (!product) throw new Error(`${cartItem.productName} is no longer available.`);
    if (product.stockQuantity < cartItem.quantity) {
      throw new Error(`Only ${product.stockQuantity} unit(s) of ${product.productName} remain in stock.`);
    }
    product.stockQuantity -= cartItem.quantity;
    const unitPrice = Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
    return {
      orderItemId: Math.max(0, ...demoState.orders.flatMap(order => (order.items || []).map(item => item.orderItemId || 0))) + index + 1,
      productId: product.productId,
      productName: product.productName,
      vendorId: product.vendorId,
      vendorName: product.businessName,
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
    paymentStatus: paymentMethod === 'DemoCard' ? 'Simulated' : 'Pending',
    paymentMethod: paymentMethod === 'DemoCard' ? 'Demo Card (no charge)' : 'CashOnDelivery',
    subtotal,
    shipping,
    tax,
    totalAmount: Number((subtotal + shipping + tax).toFixed(2)),
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || '',
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country || 'Pakistan',
    shippingAddress: [address.addressLine1, address.addressLine2, address.city, address.state, address.zipCode, address.country || 'Pakistan'].filter(Boolean).join(', '),
    items: orderItems
  };

  return {
    order,
    nextState: {
      ...demoState,
      products,
      orders: [order, ...demoState.orders]
    }
  };
};

export const cancelDemoOrder = (demoState, orderId, customerId) => {
  const order = demoState.orders.find(item => String(item.orderId) === String(orderId) && item.customerId === customerId);
  if (!order) throw new Error('Order not found.');
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) throw new Error('Only pending or confirmed orders can be cancelled.');

  const cancelledOrder = { ...order, orderStatus: 'Cancelled', paymentStatus: order.paymentStatus === 'Paid' ? 'Refunded' : order.paymentStatus };
  return {
    ...demoState,
    orders: demoState.orders.map(item => item.orderId === order.orderId ? cancelledOrder : item)
  };
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
