import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import './demo.css';

const roles = [
  { role: 'Customer', title: 'Customer Demo', description: 'Explore the shopping experience, products, cart and customer workflows.', icon: '🛍️' },
  { role: 'Vendor', title: 'Vendor Demo', description: 'Preview the seller workspace and product and order management workflows.', icon: '🏪' },
  { role: 'Admin', title: 'Admin Demo', description: 'Preview marketplace administration and platform management workflows.', icon: '🛡️' }
];

export function DemoPortal() {
  const { session, demoState, beginSession } = useDemo();
  const [choosingVendor, setChoosingVendor] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('101');
  const navigate = useNavigate();

  if (session) return <Navigate to="/demo/workspace" replace />;

  const chooseRole = (role) => {
    if (role === 'Vendor') {
      setChoosingVendor(true);
      return;
    }
    beginSession(role);
    navigate('/demo/workspace');
  };

  const enterVendorDemo = () => {
    beginSession('Vendor', Number(selectedVendorId));
    navigate('/demo/workspace');
  };

  return (
    <main className="demo-shell">
      <section className="demo-panel demo-portal">
        <div className="demo-brand">SellPoint <span>DEMO</span></div>
        <p className="demo-eyebrow">INTERACTIVE PORTFOLIO PREVIEW</p>
        <h1>Explore SellPoint</h1>
        <p className="demo-intro">Choose a role to explore the marketplace. No registration, password, or real payment is required.</p>
        <div className="demo-role-grid">
          {roles.map(item => (
            <button className="demo-role-card" key={item.role} onClick={() => chooseRole(item.role)}>
              <span className="demo-role-icon" aria-hidden="true">{item.icon}</span>
              <span className="demo-role-title">{item.title}</span>
              <span className="demo-role-description">{item.description}</span>
              <span className="demo-role-action">Continue as {item.role} <span aria-hidden="true">→</span></span>
            </button>
          ))}
        </div>
        {choosingVendor && (
          <div className="demo-vendor-choice">
            <h2>Choose a demo vendor account</h2>
            <p>Explore different application and store states. Vendor access is simulated for this portfolio preview.</p>
            <label htmlFor="demo-vendor-select">Vendor account</label>
            <select id="demo-vendor-select" value={selectedVendorId} onChange={event => setSelectedVendorId(event.target.value)}>
              {demoState.vendors.map(vendor => (
                <option key={vendor.vendorId} value={vendor.vendorId}>
                  {vendor.businessName} — {vendor.status}{vendor.status === 'Approved' && !vendor.isActive ? ' (Suspended)' : ''}
                </option>
              ))}
            </select>
            <button className="demo-secondary-button" onClick={enterVendorDemo}>Continue to vendor workspace</button>
          </div>
        )}
        <p className="demo-footnote">Demo changes are stored only in this browser and can be reset at any time.</p>
      </section>
    </main>
  );
}

export function DemoWorkspace() {
  const { session, demoState, endSession, resetWorkspace } = useDemo();
  const navigate = useNavigate();

  if (!session) return <Navigate to="/demo" replace />;

  const counts = [
    ['Products', demoState.products.length],
    ['Categories', demoState.categories.length],
    ['Vendors', demoState.vendors.length],
    ['Customers', demoState.customers.length],
    ['Orders', demoState.orders.length],
    ['Reviews', demoState.reviews.length],
    ['Disputes', demoState.disputes.length]
  ];

  const leaveDemo = () => {
    endSession();
    navigate('/demo', { replace: true });
  };

  return (
    <main className="demo-shell">
      <section className="demo-panel demo-workspace">
        <header className="demo-workspace-header">
          <div>
            <div className="demo-brand">SellPoint <span>DEMO</span></div>
            <p className="demo-eyebrow">DEMO WORKSPACE</p>
            <h1>Welcome, {session.displayName}</h1>
            <p className="demo-intro">You are exploring SellPoint as a <strong>{session.role}</strong>.</p>
          </div>
          <button className="demo-secondary-button" onClick={leaveDemo}>Switch role</button>
        </header>

        <div className="demo-notice">
          <strong>SellPoint Demo is active.</strong>
          <span>Your session and sample data are isolated from the live API, database, and real user accounts. Changes in this workspace are temporary and can be reset.</span>
        </div>

        {session.role === 'Customer' && (
          <div className="demo-customer-actions">
            <button className="demo-secondary-button" onClick={() => navigate('/products')}>Browse sample products</button>
            <button className="demo-secondary-button" onClick={() => navigate('/cart')}>Shopping cart</button>
            <button className="demo-secondary-button" onClick={() => navigate('/wishlist')}>My wishlist</button>
            <button className="demo-secondary-button" onClick={() => navigate('/customer/profile')}>My profile & addresses</button>
            <button className="demo-secondary-button" onClick={() => navigate('/order-history')}>My demo orders</button>
          </div>
        )}
        {session.role === 'Vendor' && (
          <div className="demo-customer-actions">
            <button className="demo-secondary-button" onClick={() => navigate('/vendor-dashboard')}>Vendor dashboard</button>
            <button className="demo-secondary-button" onClick={() => navigate('/vendor/products')}>Manage products</button>
            <button className="demo-secondary-button" onClick={() => navigate('/vendor/orders')}>Manage orders</button>
            <button className="demo-secondary-button" onClick={() => navigate('/vendor/revenue')}>Revenue overview</button>
          </div>
        )}
        {session.role === 'Admin' && (
          <div className="demo-customer-actions">
            <button className="demo-secondary-button" onClick={() => navigate('/admin-dashboard')}>Admin dashboard</button>
            <button className="demo-secondary-button" onClick={() => navigate('/admin/vendors')}>Manage vendors</button>
            <button className="demo-secondary-button" onClick={() => navigate('/admin/orders')}>Manage orders</button>
            <button className="demo-secondary-button" onClick={() => navigate('/admin/reports')}>Marketplace reports</button>
          </div>
        )}

        <h2>Sample marketplace data</h2>
        <div className="demo-stats-grid">
          {counts.map(([label, count]) => (
            <div className="demo-stat" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="demo-workspace-footer">
          <p>Reset restores the original fictional sample data. It does not affect your real SellPoint account or backend.</p>
          <button className="demo-reset-button" onClick={resetWorkspace}>Reset demo data</button>
        </div>
      </section>
    </main>
  );
}
