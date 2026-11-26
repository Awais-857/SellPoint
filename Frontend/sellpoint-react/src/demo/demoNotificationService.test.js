import {
  createNotificationsForStateChange,
  getDemoNotifications,
  markDemoNotificationRead,
  markAllDemoNotificationsRead
} from './demoNotificationService';

const base = {
  notifications: [],
  orders: [],
  vendors: [{ vendorId: 101, businessName: 'Nova Tech Store', status: 'Approved', isActive: true }],
  products: [],
  returnRequests: [],
  reviews: []
};

describe('demoNotificationService', () => {
  test('creates customer, vendor and admin notifications for a new order', () => {
    const order = { orderId: 6001, customerId: 301, customerName: 'Mariam', orderStatus: 'Pending', items: [{ vendorId: 101 }] };
    const next = createNotificationsForStateChange(base, { ...base, orders: [order] }, new Date('2026-11-27T10:00:00Z'));
    expect(next.notifications).toHaveLength(3);
    expect(getDemoNotifications(next, { role: 'Customer', userId: 301 })).toHaveLength(1);
    expect(getDemoNotifications(next, { role: 'Vendor', vendorId: 101 })).toHaveLength(1);
    expect(getDemoNotifications(next, { role: 'Admin', userId: 1 })).toHaveLength(1);
  });

  test('notifies only the relevant vendor when a product is submitted', () => {
    const product = { productId: 9, vendorId: 102, productName: 'New item', moderationStatus: 'Pending' };
    const next = createNotificationsForStateChange(base, { ...base, products: [product] });
    expect(getDemoNotifications(next, { role: 'Vendor', vendorId: 101 })).toHaveLength(0);
    expect(getDemoNotifications(next, { role: 'Vendor', vendorId: 102 })).toHaveLength(1);
    expect(getDemoNotifications(next, { role: 'Admin', userId: 1 })).toHaveLength(1);
  });

  test('creates a customer notification when a return is escalated', () => {
    const oldRequest = { returnId: 1, customerId: 301, vendorId: 101, productName: 'Headphones', orderId: 5, status: 'Rejected' };
    const newRequest = { ...oldRequest, status: 'Escalated' };
    const next = createNotificationsForStateChange({ ...base, returnRequests: [oldRequest] }, { ...base, returnRequests: [newRequest] });
    expect(getDemoNotifications(next, { role: 'Customer', userId: 301 })).toHaveLength(1);
    expect(getDemoNotifications(next, { role: 'Admin', userId: 1 })).toHaveLength(1);
  });

  test('marks one notification read and prevents another role from changing it', () => {
    const state = createNotificationsForStateChange(base, { ...base, orders: [{ orderId: 1, customerId: 301, customerName: 'M', items: [{ vendorId: 101 }] }] });
    const id = state.notifications.find(item => item.recipientRole === 'Customer').notificationId;
    const unchanged = markDemoNotificationRead(state, id, { role: 'Vendor', vendorId: 101 });
    expect(unchanged.notifications.find(item => item.notificationId === id).isRead).toBe(false);
    const read = markDemoNotificationRead(state, id, { role: 'Customer', userId: 301 });
    expect(read.notifications.find(item => item.notificationId === id).isRead).toBe(true);
  });

  test('marks all notifications for the active recipient as read', () => {
    const state = createNotificationsForStateChange(base, { ...base, orders: [{ orderId: 1, customerId: 301, customerName: 'M', items: [{ vendorId: 101 }] }] });
    const read = markAllDemoNotificationsRead(state, { role: 'Customer', userId: 301 });
    expect(getDemoNotifications(read, { role: 'Customer', userId: 301 }).every(item => item.isRead)).toBe(true);
    expect(getDemoNotifications(read, { role: 'Vendor', vendorId: 101 }).every(item => !item.isRead)).toBe(true);
  });
});
