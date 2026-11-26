import { createDemoState } from './demoSeedData';

export const DEMO_STATE_STORAGE_KEY = 'sellpoint_demo_state_v1';
export const DEMO_SESSION_STORAGE_KEY = 'sellpoint_demo_session_v1';
export const DEMO_STATE_VERSION = 8;
export const DEMO_CART_STORAGE_KEY = 'sellpoint_demo_cart_v1';

const readJson = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save SellPoint demo data (${key}).`, error);
    return false;
  }
};

const isValidDemoState = (data) => {
  const collectionNames = [
    'categories', 'vendors', 'customers', 'addresses', 'products',
    'orders', 'reviews', 'disputes', 'returnRequests', 'notifications', 'payments'
  ];
  return Boolean(data) && collectionNames.every(name => Array.isArray(data[name]));
};


const createLegacyDemoPayments = data => (data.orders || []).map((order, index) => {
  const refunds = (data.returnRequests || [])
    .filter(request => Number(request.orderId) === Number(order.orderId) && request.refundStatus === 'Simulated refund recorded')
    .map(request => ({ refundId: Number(request.returnId), reference: `return-${request.returnId}`, amount: Number(request.refundAmount || 0), status: 'Simulated', createdAt: request.refundedAt || request.createdAt }));
  const refundedAmount = Number(refunds.reduce((sum, refund) => sum + refund.amount, 0).toFixed(2));
  const amount = Number(order.totalAmount || 0);
  const fullyRefunded = order.paymentStatus === 'Refunded' || (amount > 0 && refundedAmount >= amount);
  const status = fullyRefunded ? 'Refunded' : refundedAmount > 0 ? 'Partially Refunded' :
    order.paymentStatus === 'Paid' ? 'Paid' : order.paymentStatus === 'Failed' ? 'Failed' : 'Pending';
  return {
    paymentId: 20001 + index, orderId: order.orderId, customerId: order.customerId,
    amount, currency: 'USD', method: order.paymentMethod || 'Cash on delivery', status,
    refundedAmount: fullyRefunded && refundedAmount === 0 ? amount : refundedAmount,
    refundStatus: fullyRefunded ? 'Refunded' : refundedAmount > 0 ? 'Partially refunded' : 'Not refunded',
    refunds, transactions: [], createdAt: order.orderDate,
    paidAt: ['Paid', 'Refunded', 'Partially Refunded'].includes(status) ? order.orderDate : null
  };
});

export const getDemoState = () => {
  const stored = readJson(DEMO_STATE_STORAGE_KEY);
  if (stored && stored.version === DEMO_STATE_VERSION && isValidDemoState(stored.data)) return stored.data;

  // Preserve visitor changes while adding payment records to existing Demo data.
  if (stored && [6, 7].includes(stored.version) && stored.data) {
    const migrated = {
      ...stored.data,
      notifications: Array.isArray(stored.data.notifications) ? stored.data.notifications : [],
      payments: (stored.data.payments || []).length ? stored.data.payments : createLegacyDemoPayments(stored.data)
    };
    if (isValidDemoState(migrated)) {
      saveDemoState(migrated);
      return migrated;
    }
  }

  const freshState = createDemoState();
  saveDemoState(freshState);
  return freshState;
};

export const saveDemoState = (data) => writeJson(DEMO_STATE_STORAGE_KEY, { version: DEMO_STATE_VERSION, data });

export const resetDemoState = () => {
  const freshState = createDemoState();
  saveDemoState(freshState);
  return freshState;
};

export const clearDemoStorage = () => {
  try {
    const keys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith('sellpoint_demo_')) keys.push(key);
    }
    keys.forEach(key => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Unable to clear all SellPoint Demo data.', error);
  }
};

export const getDemoSession = () => {
  const session = readJson(DEMO_SESSION_STORAGE_KEY);
  if (!session || !['Customer', 'Vendor', 'Admin'].includes(session.role)) return null;
  return session;
};

export const saveDemoSession = (session) => writeJson(DEMO_SESSION_STORAGE_KEY, session);

export const clearDemoSession = () => {
  try {
    window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Unable to clear the SellPoint Demo session.', error);
  }
};

const demoIdentities = {
  Customer: { userId: 301, displayName: 'Mariam Shah', email: 'mariam@example.demo' },
  Admin: { userId: 1, displayName: 'SellPoint Demo Admin', email: 'admin@example.demo' }
};

export const startDemoSession = (role, vendorId = 101) => {
  let identity = demoIdentities[role];
  if (role === 'Vendor') {
    const vendor = createDemoState().vendors.find(item => item.vendorId === Number(vendorId));
    if (!vendor) throw new Error('Choose a valid demo vendor.');
    identity = {
      userId: vendor.userId, vendorId: vendor.vendorId, displayName: vendor.ownerName,
      businessName: vendor.businessName, email: vendor.email
    };
  }
  if (!identity) throw new Error('Choose a valid demo role: Customer, Vendor, or Admin.');
  const session = { role, ...identity, startedAt: new Date().toISOString() };
  saveDemoSession(session);
  return session;
};
