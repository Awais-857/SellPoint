import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import {
  getEligibleDemoReviewItems,
  getVendorDemoReviews,
  respondToDemoReview,
  submitDemoReview
} from './demoReviewService';
import './demoCustomer.css';
import './demoVendor.css';

const dateLabel = value => new Date(value).toLocaleDateString();

function ReviewHeader({ vendor = false }) {
  const navigate = useNavigate();
  return <header className={vendor ? 'demo-vendor-header' : 'demo-shop-header'}>
    <button className={vendor ? 'demo-vendor-brand' : 'demo-shop-brand'} onClick={() => navigate(vendor ? '/vendor-dashboard' : '/products')}>SellPoint <span>{vendor ? 'VENDOR DEMO' : 'DEMO'}</span></button>
    <nav>
      {vendor ? <>
        <button onClick={() => navigate('/vendor-dashboard')}>Overview</button>
        <button onClick={() => navigate('/vendor/products')}>Products</button>
        <button onClick={() => navigate('/vendor/orders')}>Orders</button>
        <button onClick={() => navigate('/vendor/reviews')}>Reviews</button>
        <button onClick={() => navigate('/vendor/revenue')}>Revenue</button>
        <button onClick={() => navigate('/demo/workspace')}>Workspace</button>
      </> : <>
        <button onClick={() => navigate('/products')}>Shop</button>
        <button onClick={() => navigate('/order-history')}>My orders</button>
        <button onClick={() => navigate('/customer/reviews')}>My reviews</button>
        <button onClick={() => navigate('/customer/profile')}>My account</button>
      </>}
    </nav>
  </header>;
}

export function DemoCustomerReviewsPage() {
  const navigate = useNavigate();
  const { session, demoState } = useDemo();
  const eligible = getEligibleDemoReviewItems(demoState, session.userId);
  const existing = demoState.reviews.filter(review => review.customerId === session.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return <main className="demo-shop-page"><ReviewHeader /><section className="demo-shop-content">
    <p className="demo-shop-eyebrow">CUSTOMER ACCOUNT</p><h1>My product reviews</h1>
    <p className="demo-shop-muted">Reviews can be submitted for delivered purchases. Each purchased item can be reviewed once.</p>
    <section className="demo-review-panel"><h2>Purchases waiting for your review</h2>
      {eligible.length ? <div className="demo-review-purchase-list">{eligible.map(item => <article className="demo-shop-card demo-review-purchase" key={item.orderItemId}>
        <div><strong>{item.productName}{item.variantName ? ` — ${item.variantName}` : ''}</strong><small>Order #{item.orderId} · Delivered {dateLabel(item.orderDate)}</small></div>
        <button className="demo-primary-button" onClick={() => navigate(`/product/${item.productId}/review?orderItemId=${item.orderItemId}`, { state: { orderItemId: item.orderItemId } })}>Write a review</button>
      </article>)}</div> : <div className="demo-shop-card demo-empty-state"><h3>No purchases waiting for a review</h3><p>Once an order item is marked delivered, you can share your experience here.</p><button className="demo-outline-button" onClick={() => navigate('/order-history')}>View my orders</button></div>}
    </section>
    <section className="demo-review-panel"><h2>Your submitted reviews</h2>
      {existing.length ? <div className="demo-review-history">{existing.map(review => <article className="demo-shop-card" key={review.reviewId}>
        <div className="demo-review-history-heading"><strong>{review.productName}</strong><span className="demo-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div>
        <p>{review.comment || 'No written comment.'}</p>
        <div className="demo-review-meta"><span>{dateLabel(review.createdAt)}</span><span className={`demo-review-status ${review.status.toLowerCase()}`}>{review.status}</span>{review.verifiedPurchase && <span>Verified purchase</span>}</div>
        {review.moderationReason && <p className="demo-shop-error">{review.moderationReason}</p>}
        {review.vendorResponse && <div className="demo-vendor-review-response"><strong>Response from {review.vendorResponse.vendorName}</strong><p>{review.vendorResponse.comment}</p><small>{dateLabel(review.vendorResponse.respondedAt)}</small></div>}
      </article>)}</div> : <p className="demo-shop-muted">You haven't submitted any reviews yet.</p>}
    </section>
  </section></main>;
}

export function DemoReviewForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session, demoState, updateDemoState } = useDemo();
  const orderItemId = new URLSearchParams(location.search).get('orderItemId') || location.state?.orderItemId;
  const purchase = getEligibleDemoReviewItems(demoState, session.userId).find(item =>
    Number(item.productId) === Number(id) && Number(item.orderItemId) === Number(orderItemId)
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = event => {
    event.preventDefault();
    try {
      updateDemoState(submitDemoReview(demoState, session, id, orderItemId, rating, comment));
      setSuccess(true); setError('');
    } catch (err) { setError(err.message); }
  };
  if (success) return <main className="demo-shop-page"><ReviewHeader /><section className="demo-shop-content demo-review-success"><div className="demo-success-mark">✓</div><h1>Thank you for your review!</h1><p>Your review is saved and awaiting admin approval. It will appear publicly after moderation.</p><button className="demo-primary-button" onClick={() => navigate('/customer/reviews')}>View my reviews</button></section></main>;
  if (!purchase) return <main className="demo-shop-page"><ReviewHeader /><section className="demo-shop-content"><h1>Review unavailable</h1><p className="demo-shop-muted">A review requires a delivered purchase that has not already been reviewed.</p><button className="demo-outline-button" onClick={() => navigate('/customer/reviews')}>Back to my reviews</button></section></main>;
  return <main className="demo-shop-page"><ReviewHeader /><section className="demo-shop-content">
    <p className="demo-shop-eyebrow">VERIFIED PURCHASE</p><h1>Write a product review</h1>
    <form className="demo-shop-card demo-review-form" onSubmit={submit}>
      <h2>{purchase.productName}{purchase.variantName ? ` — ${purchase.variantName}` : ''}</h2><p className="demo-shop-muted">Order #{purchase.orderId} · Delivered purchase</p>
      <fieldset><legend>Your rating</legend><div className="demo-review-rating-picker">{[1,2,3,4,5].map(value=><button type="button" key={value} aria-label={`${value} star${value===1?'':'s'}`} aria-pressed={rating===value} className={value<=rating?'selected':''} onClick={()=>setRating(value)}>★</button>)}</div><small>{rating} out of 5 stars</small></fieldset>
      <label>Your review (optional)<textarea value={comment} onChange={event=>setComment(event.target.value)} maxLength={1000} rows={5} placeholder="Share your experience with this product..." /></label><small>{comment.length}/1000 characters</small>
      {error && <p className="demo-shop-error" role="alert">{error}</p>}
      <div className="demo-shop-actions"><button className="demo-primary-button" type="submit">Submit review</button><button className="demo-outline-button" type="button" onClick={()=>navigate('/customer/reviews')}>Cancel</button></div>
    </form>
  </section></main>;
}

export function DemoVendorReviewsPage() {
  const { session, demoState, updateDemoState } = useDemo();
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');
  const reviews = getVendorDemoReviews(demoState, session.vendorId);
  const reply = reviewId => {
    try {
      updateDemoState(respondToDemoReview(demoState, session.vendorId, reviewId, drafts[reviewId] || ''));
      setDrafts(current => ({ ...current, [reviewId]: '' }));
      setMessage('Your response has been published.');
    } catch (err) { setMessage(err.message); }
  };
  return <main className="demo-vendor-page"><ReviewHeader vendor /><section className="demo-vendor-content">
    <p className="demo-vendor-eyebrow">CUSTOMER FEEDBACK</p><h1>Product reviews</h1><p className="demo-shop-muted">Review feedback for products sold by your store. You can respond after an admin approves a review.</p>
    {message && <p className="demo-vendor-alert" role="status">{message}</p>}
    {reviews.length ? <div className="demo-vendor-review-list">{reviews.map(review=><article className="demo-vendor-review-card" key={review.reviewId}>
      <div className="demo-vendor-review-heading"><div><strong>{review.productName}</strong><small>{review.customerName} · {dateLabel(review.createdAt)}</small></div><span className={`demo-review-status ${review.status.toLowerCase()}`}>{review.status}</span></div>
      <div className="demo-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</div><p>{review.comment || 'No written comment.'}</p>
      {review.verifiedPurchase && <small>Verified purchase</small>}
      {review.vendorResponse ? <div className="demo-vendor-review-response"><strong>Your response</strong><p>{review.vendorResponse.comment}</p><small>{dateLabel(review.vendorResponse.respondedAt)}</small></div> : review.status === 'Approved' ? <div className="demo-vendor-review-reply"><label htmlFor={`reply-${review.reviewId}`}>Write a public response</label><textarea id={`reply-${review.reviewId}`} rows={3} maxLength={1000} value={drafts[review.reviewId] || ''} onChange={event=>setDrafts(current=>({...current,[review.reviewId]:event.target.value}))} placeholder="Thank the customer or address their feedback..." /><button className="demo-vendor-primary" onClick={()=>reply(review.reviewId)}>Publish response</button></div> : <p className="demo-shop-muted">A response will be available after approval.</p>}
    </article>)}</div> : <div className="demo-vendor-empty">No product reviews have been submitted for your store yet.</div>}
  </section></main>;
}
