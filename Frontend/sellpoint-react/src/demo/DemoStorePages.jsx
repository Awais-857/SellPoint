import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { addToCart } from '../services/cartHelper';
import ProductCard from '../components/ProductCard';
import { getPublicDemoStores, getPublicDemoStore, getPublicDemoStoreProducts, getPublicDemoStoreReviews, saveVendorStoreProfile } from './demoStoreService';
import './demoStore.css';

function StoreHeader() {
  const navigate = useNavigate();
  return <header className="demo-store-header">
    <button className="demo-store-brand" onClick={() => navigate('/products')}>SellPoint <span>DEMO</span></button>
    <nav><button onClick={() => navigate('/products')}>Shop</button><button onClick={() => navigate('/stores')}>Stores</button><button onClick={() => navigate('/wishlist')}>Wishlist</button><button onClick={() => navigate('/demo/workspace')}>Workspace</button></nav>
  </header>;
}

function VendorProfileHeader({ vendorId }) {
  const navigate = useNavigate();
  return <header className="demo-store-header">
    <button className="demo-store-brand" onClick={() => navigate('/demo/workspace')}>SellPoint <span>VENDOR</span></button>
    <nav>
      <button onClick={() => navigate('/demo/workspace')}>Dashboard</button>
      <button onClick={() => navigate('/vendor/products')}>Manage products</button>
      <button onClick={() => navigate('/vendor/orders')}>Orders</button>
      <button onClick={() => navigate('/store/' + vendorId)}>Preview public store</button>
    </nav>
  </header>;
}

export function DemoPublicStoresPage() {
  const { demoState } = useDemo();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const stores = useMemo(() => getPublicDemoStores(demoState).filter(store =>
    [store.businessName, store.tagline, store.city].some(value => String(value || '').toLowerCase().includes(search.trim().toLowerCase()))
  ), [demoState, search]);
  return <main className="demo-store-page"><StoreHeader /><section className="demo-store-content">
    <p className="demo-store-eyebrow">SELLPOINT MARKETPLACE</p><h1>Discover our stores</h1>
    <p className="demo-store-muted">Explore independent sellers and browse their approved product collections.</p>
    <label className="demo-store-search"><span className="sr-only">Search stores</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by store name or location..." /></label>
    {stores.length ? <div className="demo-store-grid">{stores.map(store => <article className="demo-store-card" key={store.vendorId}>
      <div className="demo-store-card-banner">{store.bannerUrl ? <img src={store.bannerUrl} alt="" /> : <span>🏪</span>}</div>
      <div className="demo-store-card-main"><div className="demo-store-logo">{store.logoUrl ? <img src={store.logoUrl} alt="" /> : '🏬'}</div>
        <h2>{store.businessName}</h2><p>{store.tagline || store.city || 'SellPoint marketplace seller'}</p>
        <div className="demo-store-card-stats"><span>{store.publicProductCount} products</span><span>{store.averageRating ? '★ ' + store.averageRating + ' (' + store.publicReviewCount + ')' : 'No ratings yet'}</span></div>
        <button className="demo-store-primary" onClick={() => navigate('/store/' + store.vendorId)}>Visit store</button>
      </div>
    </article>)}</div> : <div className="demo-store-empty">No stores match your search.</div>}
  </section></main>;
}

export function DemoPublicStorePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { demoState } = useDemo();
  const store = getPublicDemoStore(demoState, vendorId);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const result = useMemo(() => getPublicDemoStoreProducts(demoState, vendorId, { search, categoryId: category, sortBy: sort, page, pageSize: 9 }), [demoState, vendorId, search, category, sort, page]);
  const reviews = getPublicDemoStoreReviews(demoState, vendorId);
  const add = async product => {
    if (product.variants && product.variants.length) { navigate('/product/' + product.productId); return; }
    try { await addToCart(product, 1); window.alert(product.productName + ' added to cart.'); }
    catch (error) { window.alert(error.message || 'Unable to add this product.'); }
  };
  if (!store) return <main className="demo-store-page"><StoreHeader /><section className="demo-store-content"><h1>Store unavailable</h1><p className="demo-store-muted">This store is not public. Only approved and active vendors can have a public store.</p><button className="demo-store-primary" onClick={() => navigate('/stores')}>Browse stores</button></section></main>;
  return <main className="demo-store-page"><StoreHeader /><section className="demo-store-content">
    <div className="demo-store-hero">{store.bannerUrl && <img className="demo-store-banner" src={store.bannerUrl} alt="" />}
      <div className="demo-store-identity"><div className="demo-store-logo large">{store.logoUrl ? <img src={store.logoUrl} alt={store.businessName + ' logo'} /> : '🏬'}</div>
        <div><p className="demo-store-eyebrow">VERIFIED SELLPOINT STORE</p><h1>{store.businessName}</h1><p>{store.tagline || 'Welcome to our store'}</p>
          <div className="demo-store-card-stats"><span>{store.publicProductCount} products</span><span>{store.averageRating ? '★ ' + store.averageRating + ' average · ' + store.publicReviewCount + ' reviews' : 'No ratings yet'}</span>{store.city && <span>{store.city}{store.country ? ', ' + store.country : ''}</span>}</div>
        </div>
      </div>
    </div>
    {store.description && <section className="demo-store-about"><h2>About this store</h2><p>{store.description}</p></section>}
    {(store.publicEmail || store.publicPhone) && <section className="demo-store-contact"><h2>Contact</h2>{store.publicEmail && <p>Email: <a href={'mailto:' + store.publicEmail}>{store.publicEmail}</a></p>}{store.publicPhone && <p>Phone: {store.publicPhone}</p>}</section>}
    <section className="demo-store-products"><div className="demo-store-section-heading"><div><h2>Store products</h2><p>{result.totalCount} approved listings</p></div>
      <div className="demo-store-controls"><input aria-label="Search this store" placeholder="Search this store..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        <select aria-label="Filter by category" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{result.categories.map(item => <option key={item.categoryId} value={item.categoryId}>{item.categoryName}</option>)}</select>
        <select aria-label="Sort store products" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select>
      </div>
    </div>
    {result.products.length ? <div className="demo-store-product-grid">{result.products.map(product => <ProductCard key={product.productId} product={product} onAddToCart={add} />)}</div> : <div className="demo-store-empty">No products match these filters.</div>}
    {result.totalPages > 1 && <div className="demo-store-pagination"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {result.totalPages}</span><button disabled={page >= result.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div>}
    </section>
    <section className="demo-store-reviews"><h2>Customer reviews</h2>{reviews.length ? <div className="demo-store-review-list">{reviews.map(review => <article key={review.reviewId}><div><strong>{review.customerName}</strong><span>{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</span></div><small>{review.productName} · {new Date(review.createdAt).toLocaleDateString()}</small><p>{review.comment || 'No written comment.'}</p>{review.vendorResponse && <blockquote><strong>Response from {review.vendorResponse.vendorName || store.businessName}</strong><p>{review.vendorResponse.comment}</p></blockquote>}</article>)}</div> : <p className="demo-store-muted">This store has no approved reviews yet.</p>}</section>
  </section></main>;
}

const emptyProfile = { tagline: '', description: '', logoUrl: '', bannerUrl: '', publicEmail: '', publicPhone: '', city: '', country: '' };
export function DemoVendorStoreProfile() {
  const { session, demoState, updateDemoState } = useDemo();
  const navigate = useNavigate();
  const vendor = demoState.vendors.find(item => item.vendorId === session?.vendorId);
  const [form, setForm] = useState(() => ({ ...emptyProfile, ...(vendor || {}) }));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!vendor) return <main className="demo-store-page"><VendorProfileHeader vendorId={vendor?.vendorId} /><section className="demo-store-content"><h1>Vendor profile unavailable</h1></section></main>;
  const canEdit = vendor.status === 'Approved' && vendor.isActive;
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = event => {
    event.preventDefault();
    try { updateDemoState(saveVendorStoreProfile(demoState, session.vendorId, form)); setMessage('Your public store profile has been saved.'); setError(''); }
    catch (err) { setError(err.message); setMessage(''); }
  };
  return <main className="demo-store-page"><VendorProfileHeader vendorId={vendor?.vendorId} /><section className="demo-store-content">
    <p className="demo-store-eyebrow">VENDOR WORKSPACE</p><h1>Public store profile</h1><p className="demo-store-muted">These details appear on your public store page. Use public contact details that customers may see.</p>
    {!canEdit && <div className="demo-store-notice">Your store is not public while your vendor account is pending, rejected or inactive. Profile editing is available only to approved active vendors.</div>}
    {message && <p className="demo-store-success" role="status">{message}</p>}{error && <p className="demo-store-error" role="alert">{error}</p>}
    <form className="demo-store-profile-form" onSubmit={submit}>
      <label>Store tagline<input name="tagline" maxLength="120" value={form.tagline || ''} onChange={update} disabled={!canEdit} /></label>
      <label>About your store<textarea name="description" maxLength="1500" rows="5" value={form.description || ''} onChange={update} disabled={!canEdit} /></label>
      <label>Logo image URL<input name="logoUrl" type="url" placeholder="https://example.com/logo.png" value={form.logoUrl || ''} onChange={update} disabled={!canEdit} /></label>
      <label>Banner image URL<input name="bannerUrl" type="url" placeholder="https://example.com/banner.jpg" value={form.bannerUrl || ''} onChange={update} disabled={!canEdit} /></label>
      <label>Public contact email<input name="publicEmail" type="email" value={form.publicEmail || ''} onChange={update} disabled={!canEdit} /></label>
      <label>Public phone<input name="publicPhone" maxLength="40" value={form.publicPhone || ''} onChange={update} disabled={!canEdit} /></label>
      <label>City<input name="city" maxLength="80" value={form.city || ''} onChange={update} disabled={!canEdit} /></label>
      <label>Country<input name="country" maxLength="80" value={form.country || ''} onChange={update} disabled={!canEdit} /></label>
      <div className="demo-store-form-actions"><button className="demo-store-primary" disabled={!canEdit}>Save store profile</button><button type="button" onClick={() => navigate('/store/' + vendor.vendorId)}>Preview public store</button></div>
    </form>
  </section></main>;
}
