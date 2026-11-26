const VENDOR_ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const roundMoney = value => Number(Number(value || 0).toFixed(2));

export const getVendorProducts = (state, vendorId) =>
  state.products.filter(product => product.vendorId === vendorId);

export const saveVendorProduct = (state, vendorId, formData, productId = null) => {
  const vendor = state.vendors.find(item => item.vendorId === vendorId);
  if (!vendor || vendor.status !== 'Approved' || !vendor.isActive) {
    throw new Error('This demo vendor account is not approved for product management.');
  }

  const category = state.categories.find(item => item.categoryId === Number(formData.categoryId) && item.isActive);
  if (!category) throw new Error('Choose an active product category.');

  const productName = String(formData.productName || '').trim();
  const price = Number(formData.price);
  const stockQuantity = Number(formData.stockQuantity);
  const discountPercent = Number(formData.discountPercent || 0);
  if (!productName) throw new Error('Product name is required.');
  if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid product price.');
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error('Stock must be a whole number of zero or more.');
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 90) throw new Error('Discount must be between 0 and 90 percent.');

  const productData = {
    productName,
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    description: String(formData.description || '').trim(),
    price: roundMoney(price),
    stockQuantity,
    discountPercent,
    sku: String(formData.sku || '').trim(),
    imageUrl: String(formData.imageUrl || '').trim() || null,
    vendorId,
    businessName: vendor.businessName
  };

  if (productId !== null) {
    const existing = state.products.find(item => item.productId === Number(productId) && item.vendorId === vendorId);
    if (!existing) throw new Error('Product not found in this vendor store.');
    return {
      ...state,
      products: state.products.map(item => item.productId === existing.productId ? { ...item, ...productData } : item)
    };
  }

  const nextId = Math.max(1000, ...state.products.map(item => Number(item.productId) || 0)) + 1;
  return {
    ...state,
    products: [...state.products, {
      productId: nextId,
      ...productData,
      isActive: true,
      createdAt: new Date().toISOString()
    }]
  };
};

export const deleteVendorProduct = (state, vendorId, productId) => {
  const product = state.products.find(item => item.productId === Number(productId) && item.vendorId === vendorId);
  if (!product) throw new Error('Product not found in this vendor store.');
  return {
    ...state,
    products: state.products.filter(item => item.productId !== product.productId)
  };
};

export const toggleVendorProduct = (state, vendorId, productId) => {
  const product = state.products.find(item => item.productId === Number(productId) && item.vendorId === vendorId);
  if (!product) throw new Error('Product not found in this vendor store.');
  return {
    ...state,
    products: state.products.map(item => item.productId === product.productId ? { ...item, isActive: !item.isActive } : item)
  };
};

export const getVendorOrders = (state, vendorId) => state.orders
  .map(order => {
    const items = (order.items || []).filter(item => item.vendorId === vendorId);
    if (!items.length) return null;
    const vendorSubtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.itemTotal || 0), 0));
    return { ...order, vendorItems: items, vendorSubtotal };
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

export const updateVendorOrderItemStatus = (state, vendorId, orderItemId, status) => {
  if (!VENDOR_ORDER_STATUSES.includes(status)) throw new Error('Choose a valid order status.');
  let found = false;

  const orders = state.orders.map(order => {
    let orderItemFound = false;
    const items = (order.items || []).map(item => {
      if (Number(item.orderItemId) !== Number(orderItemId) || item.vendorId !== vendorId) return item;
      found = true;
      orderItemFound = true;
      return { ...item, itemStatus: status };
    });
    if (!orderItemFound) return order;

    const statuses = items.map(item => item.itemStatus || order.orderStatus);
    let orderStatus = 'Pending';
    if (statuses.every(value => value === 'Delivered')) orderStatus = 'Delivered';
    else if (statuses.some(value => value === 'Shipped')) orderStatus = 'Shipped';
    else if (statuses.some(value => value === 'Processing')) orderStatus = 'Processing';
    else if (statuses.every(value => value === 'Cancelled')) orderStatus = 'Cancelled';
    return { ...order, items, orderStatus };
  });

  if (!found) throw new Error('Order item not found in this vendor store.');
  return { ...state, orders };
};

const isRevenueOrder = order => order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'Refunded';

export const getVendorRevenue = (state, vendorId, period = 'monthly') => {
  const orders = getVendorOrders(state, vendorId);
  const eligibleOrders = orders.filter(isRevenueOrder);
  const transactions = eligibleOrders.flatMap(order => order.vendorItems.map(item => ({
    orderId: order.orderId,
    orderDate: order.orderDate,
    customerName: order.customerName,
    productName: item.productName,
    quantity: item.quantity,
    amount: roundMoney(item.itemTotal),
    orderStatus: item.itemStatus || order.orderStatus,
    paymentStatus: order.paymentStatus
  }))).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const totalSales = roundMoney(transactions.reduce((sum, item) => sum + item.amount, 0));
  const pendingPayments = roundMoney(transactions.filter(item => item.paymentStatus === 'Pending').reduce((sum, item) => sum + item.amount, 0));
  const vendorOrderCount = eligibleOrders.length;
  const statusCount = status => orders.filter(order => order.orderStatus.toLowerCase() === status.toLowerCase()).length;

  const groups = {};
  transactions.forEach(item => {
    const date = new Date(item.orderDate);
    const key = period === 'yearly'
      ? String(date.getFullYear())
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    groups[key] = (groups[key] || 0) + item.amount;
  });

  const chartData = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([key, totalRevenue]) => ({
    period: key,
    totalRevenue: roundMoney(totalRevenue)
  }));

  return {
    summary: {
      totalSales,
      monthlySales: chartData.length ? chartData[chartData.length - 1].totalRevenue : 0,
      pendingPayments,
      totalOrders: orders.length,
      averageOrderValue: orders.length ? roundMoney(totalSales / orders.length) : 0,
      pendingOrders: statusCount('Pending') + statusCount('Processing'),
      shippedOrders: statusCount('Shipped'),
      deliveredOrders: statusCount('Delivered')
    },
    transactions: transactions.slice(0, 10),
    chartData
  };
};
