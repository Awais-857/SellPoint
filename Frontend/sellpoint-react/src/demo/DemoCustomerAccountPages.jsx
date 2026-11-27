import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import {
  deleteDemoCustomerAddress,
  getDemoCustomerAddresses,
  getDemoCustomerProfile,
  saveDemoCustomerAddress,
  setDemoDefaultAddress,
  updateDemoCustomerProfile
} from './demoCustomerAccountService';
import './demoCustomer.css';

const emptyAddress = { label: 'Home', recipientName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'Pakistan', isDefault: false };

function AccountHeader() {
  const navigate = useNavigate();
  return <header className="demo-shop-header">
    <button className="demo-shop-brand" onClick={() => navigate('/products')}>SellPoint <span>DEMO</span></button>
    <nav>
      <button onClick={() => navigate('/products')}>Shop</button>
      <button onClick={() => navigate('/cart')}>Cart</button>
      <button onClick={() => navigate('/wishlist')}>Wishlist</button>
      <button onClick={() => navigate('/order-history')}>My orders</button>
      <button onClick={() => navigate('/customer/profile')}>My account</button>
    </nav>
  </header>;
}

export function DemoCustomerProfilePage() {
  const navigate = useNavigate();
  const { session, demoState, updateDemoState, updateSessionProfile } = useDemo();
  const profile = getDemoCustomerProfile(demoState, session.userId);
  const [form, setForm] = useState({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' });
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const save = event => {
    event.preventDefault();
    try {
      updateDemoState(updateDemoCustomerProfile(demoState, session.userId, form));
      updateSessionProfile({ displayName: form.name.trim(), email: form.email.trim().toLowerCase() });
      setFeedback('Your demo profile has been updated.');
      setError('');
    } catch (err) { setError(err.message); setFeedback(''); }
  };
  return <main className="demo-shop-page"><AccountHeader /><section className="demo-shop-content">
    <p className="demo-shop-eyebrow">CUSTOMER ACCOUNT</p><h1>My profile</h1>
    <p className="demo-shop-muted">Manage the contact details used in your SellPoint demo account.</p>
    <div className="demo-account-layout">
      <aside className="demo-shop-card demo-account-nav"><button className="active" onClick={() => navigate('/customer/profile')}>Profile details</button><button onClick={() => navigate('/customer/addresses')}>Saved addresses</button></aside>
      <form className="demo-shop-card demo-account-form" onSubmit={save}>
        <h2>Personal information</h2>
        <label>Full name<input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} required maxLength="100" /></label>
        <label>Email address<input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} required maxLength="150" /></label>
        <label>Phone number<input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} maxLength="30" placeholder="03xx-xxxxxxx" /></label>
        {error && <p className="demo-shop-error" role="alert">{error}</p>}
        {feedback && <p className="demo-shop-feedback" role="status">{feedback}</p>}
        <button className="demo-primary-button" type="submit">Save profile</button>
      </form>
    </div>
  </section></main>;
}

export function DemoCustomerAddressesPage() {
  const navigate = useNavigate();
  const { session, demoState, updateDemoState } = useDemo();
  const addresses = getDemoCustomerAddresses(demoState, session.userId);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const startAdd = () => { setEditingId(null); setForm({ ...emptyAddress, recipientName: session.displayName || '' }); setError(''); setFeedback(''); };
  const startEdit = address => { setEditingId(address.addressId); setForm({ ...address }); setError(''); setFeedback(''); };
  const save = event => {
    event.preventDefault();
    try {
      updateDemoState(saveDemoCustomerAddress(demoState, session.userId, form, editingId));
      setEditingId(null); setForm(emptyAddress); setError(''); setFeedback('Address saved successfully.');
    } catch (err) { setError(err.message); setFeedback(''); }
  };
  const remove = addressId => {
    try { updateDemoState(deleteDemoCustomerAddress(demoState, session.userId, addressId)); setFeedback('Address deleted.'); setError(''); }
    catch (err) { setError(err.message); }
  };
  const makeDefault = addressId => {
    try { updateDemoState(setDemoDefaultAddress(demoState, session.userId, addressId)); setFeedback('Default address updated.'); setError(''); }
    catch (err) { setError(err.message); }
  };
  return <main className="demo-shop-page"><AccountHeader /><section className="demo-shop-content">
    <p className="demo-shop-eyebrow">CUSTOMER ACCOUNT</p><h1>Saved addresses</h1>
    <p className="demo-shop-muted">Keep delivery addresses ready for your next order.</p>
    <div className="demo-account-layout">
      <aside className="demo-shop-card demo-account-nav"><button onClick={() => navigate('/customer/profile')}>Profile details</button><button className="active" onClick={() => navigate('/customer/addresses')}>Saved addresses</button></aside>
      <section className="demo-account-main">
        {error && <p className="demo-shop-error" role="alert">{error}</p>}
        {feedback && <p className="demo-shop-feedback" role="status">{feedback}</p>}
        <div className="demo-account-section-heading"><h2>Your delivery addresses</h2><button className="demo-primary-button" onClick={startAdd}>Add new address</button></div>
        {addresses.length === 0 ? <div className="demo-shop-card demo-empty-state"><h2>No saved addresses</h2><p>Add an address to use it during checkout.</p><button className="demo-primary-button" onClick={startAdd}>Add an address</button></div> :
          <div className="demo-saved-address-list">{addresses.map(address => <article className="demo-shop-card demo-saved-address" key={address.addressId}>
            <div className="demo-saved-address-heading"><div><strong>{address.label}</strong>{address.isDefault && <span className="demo-default-address">Default</span>}</div><strong>{address.recipientName}</strong></div>
            <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
            <p>{address.city}, {address.state} {address.zipCode}, {address.country}</p>
            <p>Phone: {address.phone}</p>
            <div className="demo-wishlist-actions"><button className="demo-outline-button" onClick={() => startEdit(address)}>Edit</button>{!address.isDefault && <button className="demo-outline-button" onClick={() => makeDefault(address.addressId)}>Set as default</button>}<button className="demo-outline-button" onClick={() => remove(address.addressId)}>Delete</button></div>
          </article>)}</div>}
        {(editingId !== null || (form !== emptyAddress && feedback === '')) && <form className="demo-shop-card demo-address-form" onSubmit={save}>
          <h2>{editingId === null ? 'Add a delivery address' : 'Edit delivery address'}</h2>
          <div className="demo-address-grid">
            <label>Address label<input value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value }))} placeholder="Home, Office, etc." /></label>
            <label>Recipient name<input value={form.recipientName} onChange={event => setForm(current => ({ ...current, recipientName: event.target.value }))} required /></label>
            <label>Phone number<input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} required /></label>
            <label>Address line 1<input value={form.addressLine1} onChange={event => setForm(current => ({ ...current, addressLine1: event.target.value }))} required /></label>
            <label>Address line 2 <span>(optional)</span><input value={form.addressLine2} onChange={event => setForm(current => ({ ...current, addressLine2: event.target.value }))} /></label>
            <label>City<input value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} required /></label>
            <label>State / Province<input value={form.state} onChange={event => setForm(current => ({ ...current, state: event.target.value }))} required /></label>
            <label>Postal code<input value={form.zipCode} onChange={event => setForm(current => ({ ...current, zipCode: event.target.value }))} required /></label>
            <label>Country<input value={form.country} onChange={event => setForm(current => ({ ...current, country: event.target.value }))} required /></label>
          </div>
          <label className="demo-address-default-choice"><input type="checkbox" checked={Boolean(form.isDefault)} onChange={event => setForm(current => ({ ...current, isDefault: event.target.checked }))} /> Set as my default address</label>
          <div className="demo-shop-actions"><button className="demo-primary-button" type="submit">Save address</button><button className="demo-outline-button" type="button" onClick={() => { setEditingId(null); setForm(emptyAddress); setError(''); }}>Cancel</button></div>
        </form>}
      </section>
    </div>
  </section></main>;
}
