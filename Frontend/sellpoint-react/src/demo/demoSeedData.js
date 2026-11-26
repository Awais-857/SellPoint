// Fictional, deterministic data used only by SellPoint Demo Mode.
// These records are intentionally independent of the production API/database.

const categories = [
  { categoryId: 1, categoryName: 'Electronics', description: 'Everyday technology and accessories', isActive: true },
  { categoryId: 2, categoryName: 'Home & Kitchen', description: 'Useful products for your home', isActive: true },
  { categoryId: 3, categoryName: 'Fashion', description: 'Clothing and accessories', isActive: true },
  { categoryId: 4, categoryName: 'Sports & Outdoors', description: 'Fitness and outdoor essentials', isActive: true },
  { categoryId: 5, categoryName: 'Beauty & Personal Care', description: 'Personal care essentials', isActive: true },
  { categoryId: 6, categoryName: 'Books & Stationery', description: 'Books and work essentials', isActive: true },
  { categoryId: 7, categoryName: 'Gaming', description: 'Gaming accessories and gear', isActive: true },
  { categoryId: 8, categoryName: 'Office', description: 'Products for productive workspaces', isActive: true }
];

const vendors = [
  { vendorId: 101, userId: 201, businessName: 'Nova Tech Store', ownerName: 'Hamza Ali', email: 'nova@example.demo', status: 'Approved', isActive: true, tagline: 'Everyday technology, made simple', description: 'Explore useful electronics and accessories selected for work, learning and everyday life.', publicEmail: 'hello@novatech.example.demo', publicPhone: '+92 300 111 0101', city: 'Lahore', country: 'Pakistan', joinedAt: '2026-01-12' },
  { vendorId: 102, userId: 202, businessName: 'Urban Home', ownerName: 'Sara Khan', email: 'urban@example.demo', status: 'Approved', isActive: true, tagline: 'Thoughtful essentials for comfortable spaces', description: 'Find practical home, kitchen and personal care products for a more comfortable everyday routine.', publicEmail: 'hello@urbanhome.example.demo', city: 'Karachi', country: 'Pakistan', joinedAt: '2026-02-03' },
  { vendorId: 103, userId: 203, businessName: 'Peak Sports', ownerName: 'Usman Raza', email: 'peak@example.demo', status: 'Approved', isActive: true, tagline: 'Gear up, move more, feel better', description: 'Discover training and outdoor essentials to support your active lifestyle.', publicEmail: 'hello@peaksports.example.demo', city: 'Islamabad', country: 'Pakistan', joinedAt: '2026-02-18' },
  { vendorId: 104, userId: 204, businessName: 'The Style Corner', ownerName: 'Ayesha Noor', email: 'style@example.demo', status: 'Pending', isActive: true, joinedAt: '2026-03-04' },
  { vendorId: 105, userId: 205, businessName: 'Pixel Gaming', ownerName: 'Bilal Ahmed', email: 'pixel@example.demo', status: 'Approved', isActive: false, joinedAt: '2026-03-11' },
  { vendorId: 106, userId: 206, businessName: 'Fashion Corner', ownerName: 'Noor Fatima', email: 'fashion@example.demo', status: 'Rejected', isActive: false, rejectionReason: 'Please provide complete business verification details.', joinedAt: '2026-03-14' }
];

const customers = [
  { userId: 301, name: 'Mariam Shah', email: 'mariam@example.demo', phone: '0300-1234567', city: 'Lahore' },
  { userId: 302, name: 'Daniyal Khan', email: 'daniyal@example.demo', phone: '0301-2345678', city: 'Multan' },
  { userId: 303, name: 'Hira Malik', email: 'hira@example.demo', phone: '0302-3456789', city: 'Islamabad' },
  { userId: 304, name: 'Zain Abbas', email: 'zain@example.demo', phone: '0303-4567890', city: 'Karachi' }
];

const addresses = [
  { addressId: 6001, customerId: 301, label: 'Home', recipientName: 'Mariam Shah', phone: '0300-1234567', addressLine1: '12 Model Town', addressLine2: '', city: 'Lahore', state: 'Punjab', zipCode: '54700', country: 'Pakistan', isDefault: true },
  { addressId: 6002, customerId: 302, label: 'Home', recipientName: 'Daniyal Khan', phone: '0301-2345678', addressLine1: '25 Gulgasht Colony', addressLine2: '', city: 'Multan', state: 'Punjab', zipCode: '66000', country: 'Pakistan', isDefault: true },
  { addressId: 6003, customerId: 303, label: 'Home', recipientName: 'Hira Malik', phone: '0302-3456789', addressLine1: '8 F-7 Markaz', addressLine2: '', city: 'Islamabad', state: 'ICT', zipCode: '44000', country: 'Pakistan', isDefault: true },
  { addressId: 6004, customerId: 304, label: 'Home', recipientName: 'Zain Abbas', phone: '0303-4567890', addressLine1: '19 Clifton Block 5', addressLine2: '', city: 'Karachi', state: 'Sindh', zipCode: '75600', country: 'Pakistan', isDefault: true }
];

const productTemplates = [
  ['Wireless Headphones', 1, 101, 89.99, 12, 'Electronics'],
  ['Smart Watch', 1, 101, 129.00, 8, 'Electronics'],
  ['Bluetooth Speaker', 1, 101, 54.50, 18, 'Electronics'],
  ['USB-C Hub', 1, 101, 34.99, 25, 'Electronics'],
  ['Mechanical Keyboard', 1, 101, 79.00, 14, 'Electronics'],
  ['Desk Lamp', 2, 102, 32.00, 20, 'Home & Kitchen'],
  ['Ceramic Dinner Set', 2, 102, 65.00, 9, 'Home & Kitchen'],
  ['Cotton Bedsheet Set', 2, 102, 48.00, 16, 'Home & Kitchen'],
  ['Insulated Water Bottle', 2, 102, 22.50, 30, 'Home & Kitchen'],
  ['Storage Organizer', 2, 102, 18.99, 0, 'Home & Kitchen'],
  ['Classic Hoodie', 3, 104, 42.00, 13, 'Fashion'],
  ['Everyday Backpack', 3, 104, 39.50, 17, 'Fashion'],
  ['Canvas Sneakers', 3, 104, 59.00, 11, 'Fashion'],
  ['Leather Wallet', 3, 104, 27.00, 22, 'Fashion'],
  ['Training Yoga Mat', 4, 103, 25.00, 19, 'Sports & Outdoors'],
  ['Adjustable Dumbbells', 4, 103, 149.00, 6, 'Sports & Outdoors'],
  ['Running Bottle', 4, 103, 16.00, 28, 'Sports & Outdoors'],
  ['Resistance Bands Set', 4, 103, 19.50, 24, 'Sports & Outdoors'],
  ['Daily Skincare Kit', 5, 102, 36.00, 15, 'Beauty & Personal Care'],
  ['Electric Toothbrush', 5, 102, 44.00, 10, 'Beauty & Personal Care'],
  ['Travel Grooming Kit', 5, 102, 29.00, 12, 'Beauty & Personal Care'],
  ['Productivity Planner', 6, 104, 14.00, 32, 'Books & Stationery'],
  ['Premium Notebook Set', 6, 104, 21.00, 27, 'Books & Stationery'],
  ['Desk Pen Set', 6, 104, 12.50, 40, 'Books & Stationery'],
  ['Gaming Mouse', 7, 105, 49.00, 16, 'Gaming'],
  ['RGB Mouse Pad', 7, 105, 24.00, 21, 'Gaming'],
  ['Gaming Headset', 7, 105, 74.00, 7, 'Gaming'],
  ['Controller Charging Dock', 7, 105, 31.00, 0, 'Gaming'],
  ['Ergonomic Office Chair', 8, 102, 189.00, 5, 'Office'],
  ['Monitor Stand', 8, 101, 38.00, 18, 'Office'],
  ['Wireless Presenter', 8, 101, 27.00, 14, 'Office'],
  ['Laptop Sleeve', 8, 104, 23.00, 26, 'Office']
];

const products = productTemplates.map((item, index) => ({
  productId: 1001 + index,
  productName: item[0],
  categoryId: item[1],
  vendorId: item[2],
  businessName: vendors.find(vendor => vendor.vendorId === item[2]).businessName,
  price: item[3],
  discountPercent: index % 6 === 0 ? 10 : 0,
  stockQuantity: item[4],
  categoryName: item[5],
  description: `A quality ${item[0].toLowerCase()} from a trusted SellPoint demo seller.`,
  imageUrl: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'
  ][index % 5],
  moderationStatus: index === 3 ? 'Pending' : index === 4 ? 'Rejected' : 'Approved',
  moderationReason: index === 4 ? 'Please add clearer product photos and a more complete description.' : null,
  variants: index === 0 ? [
    { variantId: 10011, variantName: 'Black', options: { Color: 'Black' }, price: 89.99, stockQuantity: 7 },
    { variantId: 10012, variantName: 'White', options: { Color: 'White' }, price: 94.99, stockQuantity: 5 }
  ] : index === 1 ? [
    { variantId: 10021, variantName: 'Black / 42mm', options: { Color: 'Black', Size: '42mm' }, price: 129, stockQuantity: 3 },
    { variantId: 10022, variantName: 'Silver / 46mm', options: { Color: 'Silver', Size: '46mm' }, price: 139, stockQuantity: 5 }
  ] : index === 5 ? [
    { variantId: 10061, variantName: 'Warm White', options: { Light: 'Warm White' }, price: 32, stockQuantity: 12 },
    { variantId: 10062, variantName: 'Cool White', options: { Light: 'Cool White' }, price: 34, stockQuantity: 8 }
  ] : [],
  isActive: index !== 9 && index !== 27 && index !== 3 && index !== 4,
  createdAt: '2026-03-15'
}));

const orderStatuses = ['Delivered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const paymentStatuses = ['Paid', 'Paid', 'Paid', 'Paid', 'Refunded'];
const orders = Array.from({ length: 15 }, (_, index) => {
  const customer = customers[index % customers.length];
  const product = products[(index * 2) % products.length];
  const quantity = (index % 3) + 1;
  const unitPrice = product.price * (1 - product.discountPercent / 100);
  const subtotal = Number((unitPrice * quantity).toFixed(2));
  const status = orderStatuses[index % orderStatuses.length];
  return {
    orderId: 5001 + index,
    customerId: customer.userId,
    customerName: customer.name,
    orderDate: `2026-0${(index % 3) + 1}-${String((index % 27) + 1).padStart(2, '0')}`,
    orderStatus: status,
    paymentStatus: paymentStatuses[index % paymentStatuses.length],
    subtotal,
    shipping: 5,
    totalAmount: Number((subtotal + 5).toFixed(2)),
    items: [{ orderItemId: 8001 + index, productId: product.productId, productName: product.productName, vendorId: product.vendorId, quantity, unitPrice, itemTotal: subtotal }]
  };
});

// One parent order intentionally contains products from two approved vendors.
const firstMultiVendorProduct = products.find(product => product.productId === 1001);
const secondMultiVendorProduct = products.find(product => product.productId === 1006);
const multiVendorItems = [
  { orderItemId: 8101, productId: firstMultiVendorProduct.productId, productName: firstMultiVendorProduct.productName, vendorId: firstMultiVendorProduct.vendorId, quantity: 1, unitPrice: Number((firstMultiVendorProduct.price * (1 - firstMultiVendorProduct.discountPercent / 100)).toFixed(2)), itemTotal: Number((firstMultiVendorProduct.price * (1 - firstMultiVendorProduct.discountPercent / 100)).toFixed(2)), itemStatus: 'Shipped' },
  { orderItemId: 8102, productId: secondMultiVendorProduct.productId, productName: secondMultiVendorProduct.productName, vendorId: secondMultiVendorProduct.vendorId, quantity: 2, unitPrice: Number((secondMultiVendorProduct.price * (1 - secondMultiVendorProduct.discountPercent / 100)).toFixed(2)), itemTotal: Number((secondMultiVendorProduct.price * (1 - secondMultiVendorProduct.discountPercent / 100) * 2).toFixed(2)), itemStatus: 'Processing' }
];
const multiVendorSubtotal = multiVendorItems.reduce((sum, item) => sum + item.itemTotal, 0);
orders.push({
  orderId: 5016,
  customerId: customers[0].userId,
  customerName: customers[0].name,
  orderDate: '2026-03-25',
  orderStatus: 'Processing',
  paymentStatus: 'Paid',
  subtotal: Number(multiVendorSubtotal.toFixed(2)),
  shipping: 5,
  totalAmount: Number((multiVendorSubtotal + 5).toFixed(2)),
  items: multiVendorItems
});

// Recent delivered order gives the customer a ready-to-use return example.
const returnSampleProduct = products.find(product => product.productId === 1001);
orders.push({
  orderId: 5017,
  customerId: customers[0].userId,
  customerName: customers[0].name,
  orderDate: '2026-11-20T10:00:00.000Z',
  deliveredAt: '2026-11-22T10:00:00.000Z',
  orderStatus: 'Delivered',
  paymentStatus: 'Paid',
  subtotal: 161.98,
  shipping: 5,
  tax: 16.2,
  totalAmount: 183.18,
  items: [{
    orderItemId: 8201,
    productId: returnSampleProduct.productId,
    productName: returnSampleProduct.productName,
    vendorId: returnSampleProduct.vendorId,
    vendorName: returnSampleProduct.businessName,
    variantId: 10011,
    variantName: 'Black',
    variantOptions: { Color: 'Black' },
    quantity: 2,
    unitPrice: 80.99,
    itemTotal: 161.98,
    itemStatus: 'Delivered',
    deliveredAt: '2026-11-22T10:00:00.000Z'
  }]
});

const reviews = Array.from({ length: 24 }, (_, index) => {
  const product = products[index % products.length];
  const customer = customers[index % customers.length];
  return {
    reviewId: 7001 + index,
    productId: product.productId,
    productName: product.productName,
    customerId: customer.userId,
    customerName: customer.name,
    rating: (index % 5) + 1,
    comment: ['Great quality and value.', 'Works exactly as expected.', 'Good product and quick delivery.', 'Decent quality; happy with the purchase.', 'Would recommend this item.'][index % 5],
    status: index % 6 === 0 ? 'Pending' : 'Approved',
    vendorId: product.vendorId,
    vendorName: product.businessName,
    verifiedPurchase: false,
    vendorResponse: null,
    createdAt: '2026-03-20'
  };
});

const disputes = [
  { disputeId: 9001, orderId: 5002, customerId: 303, reason: 'Item not as described', status: 'Open', createdAt: '2026-03-18' },
  { disputeId: 9002, orderId: 5004, customerId: 301, reason: 'Delivery issue', status: 'Under Review', createdAt: '2026-03-19' },
  { disputeId: 9003, orderId: 5007, customerId: 304, reason: 'Refund request', status: 'Resolved', createdAt: '2026-03-21' },
  { disputeId: 9004, orderId: 5010, customerId: 302, reason: 'Missing item', status: 'Open', createdAt: '2026-03-22' }
];

export const DEMO_SEED_DATA = {
  categories,
  vendors,
  customers,
  addresses,
  products,
  orders,
  reviews,
  disputes,
  returnRequests: [],
  notifications: []
};

export const createDemoState = () => {
  const state = JSON.parse(JSON.stringify(DEMO_SEED_DATA));
  state.payments = state.orders.map((order, index) => ({
    paymentId: 20001 + index,
    orderId: order.orderId,
    customerId: order.customerId,
    amount: Number(order.totalAmount || 0),
    currency: 'USD',
    method: order.paymentMethod || 'Cash on delivery',
    status: order.paymentStatus === 'Refunded' ? 'Refunded' : order.paymentStatus === 'Paid' ? 'Paid' : order.paymentStatus === 'Failed' ? 'Failed' : 'Pending',
    refundedAmount: order.paymentStatus === 'Refunded' ? Number(order.totalAmount || 0) : 0,
    refundStatus: order.paymentStatus === 'Refunded' ? 'Refunded' : 'Not refunded',
    refunds: [],
    transactions: [],
    createdAt: order.orderDate,
    paidAt: order.paymentStatus === 'Paid' || order.paymentStatus === 'Refunded' ? order.orderDate : null
  }));
  return state;
};
