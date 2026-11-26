import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import {
  deleteVendorProduct,
  getVendorOrders,
  getVendorProducts,
  getVendorRevenue,
  saveVendorProduct,
  toggleVendorProduct,
  updateVendorOrderItemStatus
} from './demoVendorService';
import './demoVendor.css';

const money = value => `$${Number(value || 0).toFixed(2)}`;
const dateLabel = value => new Date(value).toLocaleDateString();

function VendorHeader({ active }) {
  const navigate = useNavigate();
  const { endSession } = useDemo();
  const leave = () => { endSession(); navigate('/demo', { replace: true }); };
  return (
    <header className="demo-vendor-header">
      <button className="demo-vendor-brand" onClick={() => navigate('/vendor-dashboard')}>SellPoint <span>VENDOR DEMO</span></button>
      <nav>
        <button className={active === 'dashboard' ? 'active' : ''} onClick={() => navigate('/vendor-dashboard')}>Overview</button>
        <button className={active === 'products' ? 'active' : ''} onClick={() => navigate('/vendor/products')}>Products</button>
        <button className={active === 'orders' ? 'active' : ''} onClick={() => navigate('/vendor/orders')}>Orders</button>
        <button className={active === 'revenue' ? 'active' : ''} onClick={() => navigate('/vendor/revenue')}>Revenue</button>
        <button onClick={() => navigate('/demo/workspace')}>Workspace</button>
        <button onClick={leave}>Switch role</button>
      </nav>
    </header>
  );
}

function useVendorContext() {
  const { session, demoState, updateDemoState } = useDemo();
  const vendor = demoState.vendors.find(item => item.vendorId === session?.vendorId);
  return { session, demoState, updateDemoState, vendor, vendorId: session?.vendorId };
}

export function DemoVendorDashboard() {
  const navigate = useNavigate();
  const { demoState, vendor, vendorId } = useVendorContext();
  if (!vendor) return <main className="demo-vendor-page"><VendorHeader active="dashboard" /><p className="demo-vendor-error">Vendor profile not found.</p></main>;
  const products = getVendorProducts(demoState, vendorId);
  const orders = getVendorOrders(demoState, vendorId);
  const revenue = getVendorRevenue(demoState, vendorId);
  const activeProducts = products.filter(product => product.isActive).length;

  return (
    <main className="demo-vendor-page"><VendorHeader active="dashboard" />
      <section className="demo-vendor-content">
        <div className="demo-vendor-welcome"><div><p className="demo-vendor-eyebrow">VENDOR WORKSPACE</p><h1>Welcome, {vendor.ownerName}</h1><p>{vendor.businessName} · <span className="demo-vendor-approved">{vendor.status}{vendor.status === 'Approved' && !vendor.isActive ? ' (Suspended)' : ''}</span></p></div><span className="demo-vendor-avatar">🏪</span></div>
        {(vendor.status !== 'Approved' || !vendor.isActive) && <div className="demo-vendor-alert" role="status">{vendor.status === 'Pending' ? 'Your vendor application is awaiting admin approval. Public listings and product management are unavailable.' : vendor.status === 'Rejected' ? (vendor.rejectionReason || 'Your vendor application was rejected. Public listings and product management are unavailable.') : 'This vendor account is suspended. Its public store and product listings are hidden.'}</div>}
        <div className="demo-vendor-stats">
          <article><span>Total products</span><strong>{products.length}</strong><small>{activeProducts} active listings</small></article>
          <article><span>Orders</span><strong>{orders.length}</strong><small>Orders containing your products</small></article>
          <article><span>Total sales</span><strong>{money(revenue.summary.totalSales)}</strong><small>Excludes cancelled/refunded orders</small></article>
          <article><span>Pending payments</span><strong>{money(revenue.summary.pendingPayments)}</strong><small>Demo order records</small></article>
        </div>
        <div className="demo-vendor-section-heading"><h2>Store management</h2><p>Manage your own products, customer orders and sales activity.</p></div>
        <div className="demo-vendor-action-grid">
          <button onClick={() => navigate('/vendor/products')}><span>📦</span><strong>Manage products</strong><small>Add, edit, remove or pause listings</small></button>
          <button onClick={() => navigate('/vendor/orders')}><span>🧾</span><strong>Customer orders</strong><small>Review orders and update item status</small></button>
          <button onClick={() => navigate('/vendor/revenue')}><span>📈</span><strong>Revenue overview</strong><small>Review sales, payments and trends</small></button>
        </div>
        <div className="demo-vendor-shop-card"><div><h2>Store information</h2><p>Business owner: {vendor.ownerName}</p><p>Contact: {vendor.email}</p><p>Joined: {dateLabel(vendor.joinedAt)}</p></div><div><span>Store status</span><strong>{vendor.isActive ? 'Active' : 'Inactive'}</strong></div></div>
      </section>
    </main>
  );
}

const emptyForm = { productName: '', categoryId: '', description: '', price: '', stockQuantity: '', discountPercent: '0', sku: '', imageUrl: '' };

export function DemoVendorProducts() {
  const { demoState, updateDemoState, vendor, vendorId } = useVendorContext();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const products = getVendorProducts(demoState, vendorId);
  const categories = demoState.categories.filter(item => item.isActive);
  const editingProductHasVariants = Boolean(products.find(item => item.productId === editing)?.variants?.length);

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(''); setShowForm(true); };
  const openEdit = product => {
    setEditing(product.productId);
    setForm({ productName: product.productName, categoryId: String(product.categoryId), description: product.description || '', price: String(product.price), stockQuantity: String(product.stockQuantity), discountPercent: String(product.discountPercent || 0), sku: product.sku || '', imageUrl: product.imageUrl || '' });
    setError(''); setShowForm(true);
  };
  const submit = event => {
    event.preventDefault();
    try {
      updateDemoState(saveVendorProduct(demoState, vendorId, form, editing));
      setShowForm(false); setEditing(null); setForm(emptyForm); setError('');
    } catch (err) { setError(err.message); }
  };
  const remove = productId => {
    if (!window.confirm('Remove this product from your demo store?')) return;
    try { updateDemoState(deleteVendorProduct(demoState, vendorId, productId)); }
    catch (err) { setError(err.message); }
  };
  const toggle = productId => {
    try { updateDemoState(toggleVendorProduct(demoState, vendorId, productId)); }
    catch (err) { setError(err.message); }
  };

  return (
    <main className="demo-vendor-page"><VendorHeader active="products" /><section className="demo-vendor-content">
      <div className="demo-vendor-page-heading"><div><p className="demo-vendor-eyebrow">YOUR STORE</p><h1>Product management</h1><p>New listings and resubmitted rejected products require admin approval before they appear publicly.</p></div><button className="demo-vendor-primary" onClick={openNew} disabled={!vendor || vendor.status !== 'Approved' || !vendor.isActive}>+ Add product</button></div>
      {error && <div className="demo-vendor-alert" role="alert">{error}</div>}
      {showForm && <form className="demo-vendor-form" onSubmit={submit}><p className="demo-vendor-review-note">New product submissions are saved as Pending and will remain hidden from customers until an admin approves them.</p><div className="demo-vendor-form-heading"><h2>{editing ? 'Edit product' : 'Add a product'}</h2><button type="button" onClick={() => setShowForm(false)}>Close</button></div>
        <div className="demo-vendor-form-grid">
          <label>Product name<input required value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} /></label>
          <label>Category<select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">Choose category</option>{categories.map(category => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></label>
          <label>Price (USD)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
          <label>Stock quantity<input required type="number" min="0" step="1" value={form.stockQuantity} disabled={editingProductHasVariants} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} />{editingProductHasVariants && <small>Stock is calculated from the product's individual options.</small>}</label>
          <label>Discount (%)<input type="number" min="0" max="90" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} /></label>
          <label>SKU<input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></label>
          <label className="wide">Image URL<input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/product.jpg" /></label>
          <label className="wide">Description<textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        </div><div className="demo-vendor-form-actions"><button className="demo-vendor-primary" type="submit">Save product</button><button type="button" onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>}
      {products.length === 0 ? <div className="demo-vendor-empty">No products in this store yet. Add your first product.</div> :
        <div className="demo-vendor-table-wrap"><table className="demo-vendor-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {products.map(product => <tr key={product.productId}><td><strong>{product.productName}</strong><small>{product.sku || 'No SKU'}</small></td><td>{product.categoryName}</td><td>{money(product.price)}</td><td>{product.stockQuantity}{product.variants?.length > 0 && <small>{product.variants.map(variant => `${variant.variantName}: ${variant.stockQuantity}`).join(' · ')}</small>}</td><td><span className={`demo-vendor-pill ${product.moderationStatus.toLowerCase()}`}>{product.moderationStatus}</span><small>{product.moderationStatus === 'Approved' ? (product.isActive ? 'Public listing active' : 'Paused by vendor') : product.moderationReason || 'Awaiting admin review'}</small></td><td><div className="demo-vendor-row-actions"><button onClick={() => openEdit(product)}>{product.moderationStatus === 'Rejected' ? 'Edit & resubmit' : 'Edit'}</button>{product.moderationStatus === 'Approved' && <button onClick={() => toggle(product.productId)}>{product.isActive ? 'Pause' : 'Activate'}</button>}<button className="danger" onClick={() => remove(product.productId)}>Delete</button></div></td></tr>)}
        </tbody></table></div>}
    </section></main>
  );
}

export function DemoVendorOrders() {
  const { demoState, updateDemoState, vendorId } = useVendorContext();
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const orders = getVendorOrders(demoState, vendorId);
  const filtered = filter === 'All' ? orders : orders.filter(order => order.orderStatus.toLowerCase() === filter.toLowerCase());

  const updateStatus = (orderItemId, status) => {
    try { updateDemoState(updateVendorOrderItemStatus(demoState, vendorId, orderItemId, status)); setError(''); }
    catch (err) { setError(err.message); }
  };

  return (
    <main className="demo-vendor-page"><VendorHeader active="orders" /><section className="demo-vendor-content">
      <div className="demo-vendor-page-heading"><div><p className="demo-vendor-eyebrow">FULFILMENT</p><h1>Customer orders</h1><p>Orders are filtered to include only items sold by your store.</p></div></div>
      <div className="demo-vendor-filter">{['All','Pending','Processing','Shipped','Delivered','Cancelled'].map(value => <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      {error && <div className="demo-vendor-alert" role="alert">{error}</div>}
      {filtered.length === 0 ? <div className="demo-vendor-empty">No matching orders found.</div> :
        <div className="demo-vendor-order-list">{filtered.map(order => <article className="demo-vendor-order-card" key={order.orderId}>
          <div className="demo-vendor-order-heading"><div><span>ORDER #{order.orderId}</span><strong>{order.customerName}</strong><small>{dateLabel(order.orderDate)} · {order.customerEmail || 'Demo customer'}</small></div><div><span className="demo-vendor-pill">{order.orderStatus}</span><strong>{money(order.vendorSubtotal)}</strong></div></div>
          {order.vendorItems.map(item => <div className="demo-vendor-order-item" key={item.orderItemId}><div><strong>{item.productName}</strong><small>{item.quantity} × {money(item.unitPrice)}</small></div><div><span>{money(item.itemTotal)}</span><select value={item.itemStatus || order.orderStatus} onChange={e => updateStatus(item.orderItemId, e.target.value)}><option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled" disabled>Cancelled</option></select></div></div>)}
        </article>)}</div>}
    </section></main>
  );
}

export function DemoVendorRevenue() {
  const { demoState, vendorId } = useVendorContext();
  const [period, setPeriod] = useState('monthly');
  const revenue = useMemo(() => getVendorRevenue(demoState, vendorId, period), [demoState, vendorId, period]);
  const max = Math.max(1, ...revenue.chartData.map(item => item.totalRevenue));

  return (
    <main className="demo-vendor-page"><VendorHeader active="revenue" /><section className="demo-vendor-content">
      <div className="demo-vendor-page-heading"><div><p className="demo-vendor-eyebrow">STORE PERFORMANCE</p><h1>Revenue overview</h1><p>Calculated from fictional orders and your store's order items.</p></div>
        <div className="demo-vendor-period"><button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Monthly</button><button className={period === 'yearly' ? 'active' : ''} onClick={() => setPeriod('yearly')}>Yearly</button></div>
      </div>
      <div className="demo-vendor-stats"><article><span>Total sales</span><strong>{money(revenue.summary.totalSales)}</strong><small>Excludes cancelled/refunded orders</small></article><article><span>Average order value</span><strong>{money(revenue.summary.averageOrderValue)}</strong><small>Based on vendor orders</small></article><article><span>Pending payments</span><strong>{money(revenue.summary.pendingPayments)}</strong><small>Awaiting payment in demo records</small></article><article><span>Total orders</span><strong>{revenue.summary.totalOrders}</strong><small>{revenue.summary.deliveredOrders} delivered</small></article></div>
      <section className="demo-vendor-chart-card"><h2>{period === 'monthly' ? 'Monthly' : 'Yearly'} sales</h2>
        {revenue.chartData.length === 0 ? <p>No revenue records yet.</p> : <div className="demo-vendor-chart">{revenue.chartData.map(item => <div className="demo-vendor-chart-column" key={item.period}><strong>{money(item.totalRevenue)}</strong><div style={{ height: `${Math.max(8, item.totalRevenue / max * 190)}px` }} /><span>{item.period}</span></div>)}</div>}
      </section>
      <section className="demo-vendor-chart-card"><h2>Recent transactions</h2>
        {revenue.transactions.length === 0 ? <p>No transactions available.</p> : <div className="demo-vendor-table-wrap"><table className="demo-vendor-table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead><tbody>{revenue.transactions.map((item,index) => <tr key={`${item.orderId}-${index}`}><td>#{item.orderId}</td><td>{dateLabel(item.orderDate)}</td><td>{item.customerName}</td><td>{item.productName} × {item.quantity}</td><td>{money(item.amount)}</td><td>{item.orderStatus}</td></tr>)}</tbody></table></div>}
      </section>
    </section></main>
  );
}
