const money = value => Number(Number(value || 0).toFixed(2));

export const getAdminOverview = state => {
  const activeProducts = state.products.filter(item => item.isActive);
  const pendingVendors = state.vendors.filter(item => item.status === 'Pending');
  const pendingReviews = state.reviews.filter(item => item.status === 'Pending');
  const openDisputes = state.disputes.filter(item => !['Resolved', 'Rejected'].includes(item.status));
  const revenueOrders = state.orders.filter(item => item.orderStatus !== 'Cancelled' && item.paymentStatus !== 'Refunded');

  return {
    totalCustomers: state.customers.length,
    totalVendors: state.vendors.length,
    approvedVendors: state.vendors.filter(item => item.status === 'Approved').length,
    pendingVendors: pendingVendors.length,
    totalProducts: state.products.length,
    activeProducts: activeProducts.length,
    totalOrders: state.orders.length,
    pendingOrders: state.orders.filter(item => ['Pending', 'Processing'].includes(item.orderStatus)).length,
    totalRevenue: money(revenueOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)),
    pendingReviews: pendingReviews.length,
    openDisputes: openDisputes.length
  };
};

export const updateVendorApproval = (state, vendorId, decision) => {
  if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Choose a valid vendor decision.');
  const vendor = state.vendors.find(item => item.vendorId === Number(vendorId));
  if (!vendor) throw new Error('Vendor not found.');
  return {
    ...state,
    vendors: state.vendors.map(item => item.vendorId === vendor.vendorId
      ? { ...item, status: decision, isActive: decision === 'Approved' }
      : item)
  };
};

export const toggleVendorActive = (state, vendorId) => {
  const vendor = state.vendors.find(item => item.vendorId === Number(vendorId));
  if (!vendor || vendor.status !== 'Approved') throw new Error('Only approved vendors can be activated or suspended.');
  return {
    ...state,
    vendors: state.vendors.map(item => item.vendorId === vendor.vendorId ? { ...item, isActive: !item.isActive } : item)
  };
};

export const saveAdminCategory = (state, values, categoryId = null) => {
  const categoryName = String(values.categoryName || '').trim();
  const description = String(values.description || '').trim();
  if (!categoryName) throw new Error('Category name is required.');
  const duplicate = state.categories.some(item => item.categoryName.toLowerCase() === categoryName.toLowerCase() && item.categoryId !== Number(categoryId));
  if (duplicate) throw new Error('A category with this name already exists.');

  if (categoryId !== null) {
    const existing = state.categories.find(item => item.categoryId === Number(categoryId));
    if (!existing) throw new Error('Category not found.');
    return {
      ...state,
      categories: state.categories.map(item => item.categoryId === existing.categoryId
        ? { ...item, categoryName, description }
        : item)
    };
  }

  const nextId = Math.max(0, ...state.categories.map(item => Number(item.categoryId) || 0)) + 1;
  return {
    ...state,
    categories: [...state.categories, { categoryId: nextId, categoryName, description, isActive: true }]
  };
};

export const toggleCategoryActive = (state, categoryId) => {
  const category = state.categories.find(item => item.categoryId === Number(categoryId));
  if (!category) throw new Error('Category not found.');
  if (category.isActive && state.products.some(item => item.categoryId === category.categoryId && item.isActive)) {
    throw new Error('Pause or move active products in this category before deactivating it.');
  }
  return {
    ...state,
    categories: state.categories.map(item => item.categoryId === category.categoryId ? { ...item, isActive: !item.isActive } : item)
  };
};

export const updateAdminOrderStatus = (state, orderId, status) => {
  const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) throw new Error('Choose a valid order status.');
  const order = state.orders.find(item => item.orderId === Number(orderId));
  if (!order) throw new Error('Order not found.');
  return {
    ...state,
    orders: state.orders.map(item => item.orderId === order.orderId
      ? { ...item, orderStatus: status, items: (item.items || []).map(line => ({ ...line, itemStatus: status })) }
      : item)
  };
};

export const updateAdminDispute = (state, disputeId, status, adminNotes) => {
  if (!['Under Review', 'Resolved', 'Rejected'].includes(status)) throw new Error('Choose a valid dispute status.');
  const dispute = state.disputes.find(item => item.disputeId === Number(disputeId));
  if (!dispute) throw new Error('Dispute not found.');
  if (!String(adminNotes || '').trim()) throw new Error('Add an admin note before saving the decision.');
  return {
    ...state,
    disputes: state.disputes.map(item => item.disputeId === dispute.disputeId
      ? { ...item, status, adminNotes: String(adminNotes).trim(), resolvedAt: ['Resolved', 'Rejected'].includes(status) ? new Date().toISOString() : null }
      : item)
  };
};

export const moderateAdminReview = (state, reviewId, decision) => {
  if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Choose a valid review decision.');
  const review = state.reviews.find(item => item.reviewId === Number(reviewId));
  if (!review) throw new Error('Review not found.');
  return {
    ...state,
    reviews: state.reviews.map(item => item.reviewId === review.reviewId ? { ...item, status: decision } : item)
  };
};

export const getAdminReport = (state, fromDate, toDate, grouping = 'monthly') => {
  const start = fromDate ? new Date(`${fromDate}T00:00:00`) : new Date('2000-01-01T00:00:00');
  const end = toDate ? new Date(`${toDate}T23:59:59`) : new Date('2999-12-31T23:59:59');
  const orders = state.orders.filter(order => {
    const date = new Date(order.orderDate);
    return date >= start && date <= end && order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'Refunded';
  });
  const groups = {};
  orders.forEach(order => {
    const date = new Date(order.orderDate);
    const key = grouping === 'daily'
      ? date.toISOString().slice(0, 10)
      : grouping === 'yearly'
        ? String(date.getFullYear())
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = { period: key, totalOrders: 0, totalRevenue: 0, totalSubTotal: 0, totalShipping: 0, totalTax: 0 };
    groups[key].totalOrders += 1;
    groups[key].totalRevenue += Number(order.totalAmount || 0);
    groups[key].totalSubTotal += Number(order.subtotal || 0);
    groups[key].totalShipping += Number(order.shipping || 0);
  });
  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period)).map(item => ({
    ...item,
    totalRevenue: money(item.totalRevenue),
    totalSubTotal: money(item.totalSubTotal),
    totalShipping: money(item.totalShipping),
    totalTax: money(item.totalTax),
    averageOrderValue: item.totalOrders ? money(item.totalRevenue / item.totalOrders) : 0
  }));
};

export const getAdminTopProducts = state => {
  const totals = {};
  state.orders.filter(order => order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'Refunded')
    .forEach(order => (order.items || []).forEach(item => {
      if (!totals[item.productId]) totals[item.productId] = { productId: item.productId, productName: item.productName, unitsSold: 0, revenue: 0 };
      totals[item.productId].unitsSold += Number(item.quantity || 0);
      totals[item.productId].revenue += Number(item.itemTotal || 0);
    }));
  return Object.values(totals).map(item => ({ ...item, revenue: money(item.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
};

export const getAdminTopVendors = state => {
  const totals = {};
  state.orders.filter(order => order.orderStatus !== 'Cancelled' && order.paymentStatus !== 'Refunded')
    .forEach(order => (order.items || []).forEach(item => {
      const vendor = state.vendors.find(entry => entry.vendorId === item.vendorId);
      if (!totals[item.vendorId]) totals[item.vendorId] = { vendorId: item.vendorId, businessName: vendor?.businessName || 'Unknown vendor', unitsSold: 0, revenue: 0 };
      totals[item.vendorId].unitsSold += Number(item.quantity || 0);
      totals[item.vendorId].revenue += Number(item.itemTotal || 0);
    }));
  return Object.values(totals).map(item => ({ ...item, revenue: money(item.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
};
