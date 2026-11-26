import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { addToCart } from '../services/cartHelper';
import {
  DEMO_WISHLIST_UPDATED_EVENT,
  getDemoWishlist,
  getDemoWishlistIds,
  removeDemoWishlistItem,
  toggleDemoWishlistItem
} from './demoWishlistService';
import './demoCustomer.css';

export function DemoWishlistButton({ product }) {
  const [saved, setSaved] = useState(() => getDemoWishlistIds().includes(Number(product.productId)));

  useEffect(() => {
    const refresh = () => setSaved(getDemoWishlistIds().includes(Number(product.productId)));
    window.addEventListener(DEMO_WISHLIST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DEMO_WISHLIST_UPDATED_EVENT, refresh);
  }, [product.productId]);

  const toggle = event => {
    event.stopPropagation();
    toggleDemoWishlistItem(product.productId);
  };

  return <button type="button" className={`demo-wishlist-toggle ${saved ? 'saved' : ''}`}
    aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
    aria-pressed={saved} onClick={toggle}>{saved ? '♥' : '♡'}</button>;
}

export function DemoWishlistPage() {
  const { demoState } = useDemo();
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getDemoWishlist(demoState));
  const [message, setMessage] = useState('');

  useEffect(() => {
    const refresh = () => setItems(getDemoWishlist(demoState));
    window.addEventListener(DEMO_WISHLIST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DEMO_WISHLIST_UPDATED_EVENT, refresh);
  }, [demoState]);

  const remove = productId => removeDemoWishlistItem(productId);

  const moveToCart = async product => {
    try {
      await addToCart(product, 1);
      remove(product.productId);
      setMessage(`${product.productName} moved to your cart.`);
    } catch (error) {
      setMessage(error.message || 'Unable to add this item to your cart.');
    }
  };

  return <main className="demo-shop-page">
    <header className="demo-shop-header">
      <button className="demo-shop-brand" onClick={() => navigate('/products')}>SellPoint <span>DEMO</span></button>
      <nav>
        <button onClick={() => navigate('/products')}>Shop</button>
        <button onClick={() => navigate('/cart')}>Cart</button>
        <button onClick={() => navigate('/order-history')}>My orders</button>
        <button onClick={() => navigate('/demo/workspace')}>Demo workspace</button>
      </nav>
    </header>
    <section className="demo-shop-content">
      <p className="demo-shop-eyebrow">CUSTOMER ACCOUNT</p>
      <h1>My wishlist</h1>
      <p className="demo-shop-muted">Keep products you may want to purchase later.</p>
      {message && <p className="demo-shop-feedback" role="status">{message}</p>}
      {!items.length ? <div className="demo-shop-card demo-empty-state">
        <h2>Your wishlist is empty</h2><p>Save products using the heart button while browsing.</p>
        <button className="demo-primary-button" onClick={() => navigate('/products')}>Explore products</button>
      </div> : <div className="demo-wishlist-grid">
        {items.map(item => <article className="demo-shop-card demo-wishlist-card" key={item.productId}>
          {item.isVisible && item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <div className="demo-wishlist-unavailable">♡</div>}
          <div className="demo-wishlist-info">
            <h2>{item.productName}</h2>
            {item.isVisible ? <p>{item.businessName}</p> : <p>This product is no longer publicly available.</p>}
            {item.isAvailable ? <strong>${Number(item.price * (1 - (item.discountPercent || 0) / 100)).toFixed(2)}</strong> : <span className="demo-wishlist-status">Unavailable</span>}
            <div className="demo-wishlist-actions">
              {item.isAvailable && <button className="demo-primary-button" onClick={() => moveToCart(item)}>Move to cart</button>}
              <button className="demo-outline-button" onClick={() => remove(item.productId)}>Remove</button>
            </div>
          </div>
        </article>)}
      </div>}
    </section>
  </main>;
}
