import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { addToCart, clearCart, getCart } from '../services/cartHelper';
import { addDemoDispute, buildDemoOrder, calculateDemoCartSummary, cancelDemoOrder } from './demoOrderService';
import './demoCustomer.css';
import { getDemoCustomerAddresses } from './demoCustomerAccountService';
import { getDemoReviewableOrderItem } from './demoReviewService';

const money = value => `$${Number(value || 0).toFixed(2)}`;
const formatDate = value => new Date(value).toLocaleString();

function DemoHeader({ backLabel = 'Demo workspace', backTo = '/demo/workspace' }) {
  const navigate = useNavigate();
  return (
    <header className="demo-shop-header">
      <button className="demo-shop-brand" onClick={() => navigate('/products')}>SellPoint <span>DEMO</span></button>
      <nav>
        <button onClick={() => navigate('/products')}>Shop</button>
        <button onClick={() => navigate('/cart')}>Cart</button>
        <button onClick={() => navigate('/wishlist')}>Wishlist</button>
        <button onClick={() => navigate('/order-history')}>My orders</button>
        <button onClick={() => navigate('/customer/profile')}>My account</button>
        <button onClick={() => navigate(backTo)}>{backLabel}</button>
      </nav>
    </header>
  );
}

export function DemoCheckout() {
  const navigate = useNavigate();
  const { session, demoState, updateDemoState } = useDemo();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CashOnDelivery');
  const addresses = getDemoCustomerAddresses(demoState, session.userId);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const selectedAddress = addresses.find(item => item.addressId === Number(selectedAddressId)) || addresses.find(item => item.isDefault) || addresses[0] || null;

  useEffect(() => {
    getCart().then(setItems).catch(() => setError('Unable to load your demo cart.')).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => calculateDemoCartSummary(items), [items]);

  const placeOrder = () => {
    if (!selectedAddress) {
      setError('Please add a delivery address to your account before placing the order.');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const result = buildDemoOrder(demoState, session, items, selectedAddress, paymentMethod);
      updateDemoState(result.nextState);
      clearCart();
      navigate(`/order-confirmation/${result.order.orderId}`);
    } catch (err) {
      setError(err.message || 'Unable to place this demo order.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <main className="demo-shop-page"><DemoHeader /><p className="demo-shop-loading">Loading checkout…</p></main>;
  if (!items.length) return <Navigate to="/cart" replace />;

  return (
    <main className="demo-shop-page">
      <DemoHeader backLabel="Back to cart" backTo="/cart" />
      <section className="demo-shop-content">
        <p className="demo-shop-eyebrow">DEMO CHECKOUT</p>
        <h1>Complete your order</h1>
        <p className="demo-shop-muted">This is a simulated checkout. No real payment is collected and no order is sent to a server.</p>
        {error && <div className="demo-shop-error" role="alert">{error}</div>}
        <div className="demo-checkout-grid">
          <section className="demo-shop-card">
            <div className="demo-account-section-heading"><h2>Delivery address</h2><button className="demo-outline-button" type="button" onClick={() => navigate('/customer/addresses')}>Manage addresses</button></div>
            {addresses.length ? <div className="demo-checkout-address-list">{addresses.map(item => <label className={selectedAddress?.addressId === item.addressId ? 'selected' : ''} key={item.addressId}>
              <input type="radio" name="shippingAddress" checked={selectedAddress?.addressId === item.addressId} onChange={() => setSelectedAddressId(item.addressId)} />
              <span><strong>{item.label}{item.isDefault ? ' · Default' : ''}</strong><small>{item.recipientName} · {item.phone}</small><small>{item.addressLine1}{item.addressLine2 ? `, ${item.addressLine2}` : ''}, {item.city}, {item.state} {item.zipCode}, {item.country}</small></span>
            </label>)}</div> : <div className="demo-shop-feedback">You haven't saved a delivery address yet. <button className="demo-inline-link" type="button" onClick={() => navigate('/customer/addresses')}>Add an address</button> before checkout.</div>}
            <h2 className="demo-payment-heading">Payment method</h2>
            <label className="demo-payment-choice"><input type="radio" checked={paymentMethod === 'CashOnDelivery'} onChange={() => setPaymentMethod('CashOnDelivery')} /> Cash on delivery</label>
            <label className="demo-payment-choice"><input type="radio" checked={paymentMethod === 'DemoCard'} onChange={() => setPaymentMethod('DemoCard')} /> Simulated card payment <span>(no card details or charge)</span></label>
            <button className="demo-primary-button" onClick={placeOrder} disabled={placing}>{placing ? 'Placing order…' : 'Place demo order'}</button>
          </section>
          <aside className="demo-shop-card demo-summary-card">
            <h2>Order summary</h2>
            {items.map(item => <div className="demo-summary-item" key={item.cartId || `${item.productId}-${item.variantId || 'default'}`}><span>{item.productName}{item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}</span><strong>{money(item.itemTotal)}</strong></div>)}
            <div className="demo-summary-line"><span>Subtotal</span><strong>{money(summary.subtotal)}</strong></div>
            <div className="demo-summary-line"><span>Shipping</span><strong>{money(summary.shipping)}</strong></div>
            <div className="demo-summary-line"><span>Tax (10%)</span><strong>{money(summary.tax)}</strong></div>
            <div className="demo-summary-line demo-summary-total"><span>Total</span><strong>{money(summary.total)}</strong></div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function DemoOrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, demoState } = useDemo();
  const order = demoState.orders.find(item => String(item.orderId) === String(id) && item.customerId === session.userId);
  if (!order) return <main className="demo-shop-page"><DemoHeader /><section className="demo-shop-content"><h1>Order not found</h1><button onClick={() => navigate('/order-history')}>View my orders</button></section></main>;
  return (
    <main className="demo-shop-page"><DemoHeader />
      <section className="demo-shop-content demo-confirmation">
        <div className="demo-success-mark">✓</div>
        <p className="demo-shop-eyebrow">DEMO ORDER CONFIRMED</p>
        <h1>Your order has been placed!</h1>
        <p className="demo-shop-muted">This order exists only in this browser's demo data. No real payment or shipment was created.</p>
        <div className="demo-shop-card demo-confirmation-card">
          <div><span>Order number</span><strong>#{order.orderId}</strong></div>
          <div><span>Order date</span><strong>{formatDate(order.orderDate)}</strong></div>
          <div><span>Order status</span><strong>{order.orderStatus}</strong></div>
          <div><span>Payment</span><strong>{order.paymentMethod === 'Demo Card (no charge)' ? 'Simulated — no charge' : 'Cash on delivery'}</strong></div>
          <div><span>Total</span><strong>{money(order.totalAmount)}</strong></div>
        </div>
        <div className="demo-shop-actions"><button className="demo-primary-button" onClick={() => navigate('/order-history')}>View my orders</button><button className="demo-outline-button" onClick={() => navigate('/products')}>Continue shopping</button></div>
      </section>
    </main>
  );
}

export function DemoOrderHistory() {
  const navigate = useNavigate();
  const { session, demoState } = useDemo();
  const [filter, setFilter] = useState('All');
  const orders = demoState.orders.filter(order => order.customerId === session.userId).sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
  const filtered = filter === 'All' ? orders : orders.filter(order => order.orderStatus.toLowerCase() === filter.toLowerCase());
  return (
    <main className="demo-shop-page"><DemoHeader />
      <section className="demo-shop-content">
        <p className="demo-shop-eyebrow">CUSTOMER ACCOUNT</p><h1>My orders</h1>
        <div className="demo-filter-row">{['All','Pending','Shipped','Delivered','Cancelled'].map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div>
        {filtered.length === 0 ? <div className="demo-shop-card demo-empty-state"><h2>No orders found</h2><p>Try another status filter or browse the sample products.</p><button className="demo-primary-button" onClick={() => navigate('/products')}>Browse products</button></div> :
          <div className="demo-order-list">{filtered.map(order => <article className="demo-shop-card demo-order-card" key={order.orderId}>
            <div className="demo-order-card-top"><div><span>ORDER</span><strong>#{order.orderId}</strong></div><span className="demo-order-status">{order.orderStatus}</span></div>
            <p>{formatDate(order.orderDate)} · {order.items.length} item(s)</p>
            <div className="demo-order-card-bottom"><strong>{money(order.totalAmount)}</strong><button className="demo-outline-button" onClick={() => navigate(`/order-detail/${order.orderId}`)}>View details</button></div>
          </article>)}</div>}
      </section>
    </main>
  );
}

export function DemoOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, demoState, updateDemoState } = useDemo();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const order = demoState.orders.find(item => String(item.orderId) === String(id) && item.customerId === session.userId);
  if (!order) return <main className="demo-shop-page"><DemoHeader /><section className="demo-shop-content"><h1>Order not found</h1><button onClick={() => navigate('/order-history')}>Back to orders</button></section></main>;

  const handleCancel = () => {
    try {
      updateDemoState(cancelDemoOrder(demoState, id, session.userId));
      setError('');
    } catch (err) { setError(err.message); }
  };
  const handleDispute = () => {
    try {
      updateDemoState(addDemoDispute(demoState, id, session.userId, reason));
      setReason(''); setError('Your demo dispute has been submitted.');
    } catch (err) { setError(err.message); }
  };
  const handleReorder = async () => {
    try {
      for (const item of order.items) {
        const product = demoState.products.find(product => product.productId === item.productId && product.isActive);
        if (!product) continue;
        if (Array.isArray(product.variants) && product.variants.length) {
          if (item.variantId == null) {
            setError(`Please choose an option again for ${product.productName}.`);
            navigate(`/product/${product.productId}`);
            return;
          }
          const variant = product.variants.find(entry => Number(entry.variantId) === Number(item.variantId));
          if (variant && variant.stockQuantity > 0) await addToCart(product, Math.min(item.quantity, variant.stockQuantity), variant);
        } else if (product.stockQuantity > 0) {
          await addToCart(product, Math.min(item.quantity, product.stockQuantity));
        }
      }
      navigate('/cart');
    } catch (err) { setError(err.message || 'Unable to reorder these items.'); }
  };

  return (
    <main className="demo-shop-page"><DemoHeader backLabel="Back to orders" backTo="/order-history" />
      <section className="demo-shop-content">
        <p className="demo-shop-eyebrow">ORDER DETAILS</p><h1>Order #{order.orderId}</h1>
        <div className="demo-shop-card demo-detail-card">
          <div className="demo-detail-grid"><div><span>Status</span><strong>{order.orderStatus}</strong></div><div><span>Payment</span><strong>{order.paymentStatus}</strong></div><div><span>Placed</span><strong>{formatDate(order.orderDate)}</strong></div><div><span>Total</span><strong>{money(order.totalAmount)}</strong></div></div>
          <h2>Items</h2>
          {order.items.map(item => <div className="demo-summary-item" key={item.orderItemId}><span>{item.productName}{item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}</span><strong>{money(item.itemTotal)}</strong>{getDemoReviewableOrderItem(demoState, session.userId, item.productId, item.orderItemId) && <button className="demo-inline-link" onClick={() => navigate(`/product/${item.productId}/review`, { state: { orderItemId: item.orderItemId } })}>Write a review</button>}</div>)}
          <h2>Shipping address</h2><p><strong>{order.shippingAddressSnapshot?.recipientName || order.recipientName || order.customerName}</strong>{order.recipientPhone ? ` · ${order.recipientPhone}` : ''}</p><p>{order.shippingAddress || [order.addressLine1, order.addressLine2, order.city, order.state, order.zipCode, order.country].filter(Boolean).join(', ')}</p>
          <h2>Summary</h2><div className="demo-summary-line"><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div><div className="demo-summary-line"><span>Shipping</span><strong>{money(order.shipping)}</strong></div><div className="demo-summary-line"><span>Tax</span><strong>{money(order.tax)}</strong></div><div className="demo-summary-line demo-summary-total"><span>Total</span><strong>{money(order.totalAmount)}</strong></div>
        </div>
        {error && <p className="demo-shop-feedback" role="status">{error}</p>}
        <div className="demo-shop-actions">
          <button className="demo-outline-button" onClick={() => navigate(`/order-tracking/${order.orderId}`)}>Track order</button>
          {['Pending','Confirmed'].includes(order.orderStatus) && <button className="demo-outline-button" onClick={handleCancel}>Cancel order</button>}
          <button className="demo-primary-button" onClick={handleReorder}>Reorder available items</button>
        </div>
        <section className="demo-shop-card demo-dispute-card"><h2>Need help with this order?</h2><textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe the issue with your order" rows="3" /><button className="demo-outline-button" onClick={handleDispute}>Submit demo dispute</button></section>
      </section>
    </main>
  );
}

export function DemoOrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, demoState } = useDemo();
  const order = demoState.orders.find(item => String(item.orderId) === String(id) && item.customerId === session.userId);
  if (!order) return <main className="demo-shop-page"><DemoHeader /><section className="demo-shop-content"><h1>Order not found</h1><button onClick={() => navigate('/order-history')}>Back to orders</button></section></main>;
  const steps = ['Pending','Confirmed','Shipped','Delivered'];
  const current = steps.indexOf(order.orderStatus);
  return <main className="demo-shop-page"><DemoHeader backLabel="Back to order" backTo={`/order-detail/${order.orderId}`} /><section className="demo-shop-content">
    <p className="demo-shop-eyebrow">ORDER TRACKING</p><h1>Order #{order.orderId}</h1><div className="demo-shop-card demo-tracking-card">
      <div className="demo-tracking-steps">{steps.map((step,index)=><div key={step} className={index <= current ? 'completed' : ''}><span>{index < current ? '✓' : index + 1}</span><strong>{step}</strong></div>)}</div>
      <p>Current status: <strong>{order.orderStatus}</strong></p><p>Order date: {formatDate(order.orderDate)}</p><p>Shipping to: {order.shippingAddress || 'Address not recorded'}</p>
      <p className="demo-shop-muted">Tracking is simulated for this portfolio demo.</p>
    </div>
    <button className="demo-primary-button" onClick={() => navigate(`/order-detail/${order.orderId}`)}>View order details</button>
  </section></main>;
}
