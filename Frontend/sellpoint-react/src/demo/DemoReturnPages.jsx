import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import {
  createDemoReturnRequest, decideDemoReturnAsVendor, decideDemoReturnAsAdmin,
  escalateDemoReturn, getCustomerDemoReturns, getVendorDemoReturns, getReturnEligibility
} from './demoReturnService';
import './demoReturn.css';

const money = value => `$${Number(value || 0).toFixed(2)}`;
const dateLabel = value => value ? new Date(value).toLocaleDateString() : '—';

function ReturnHeader({ role }) {
  const navigate = useNavigate();
  const { endSession } = useDemo();
  const links = role === 'Customer'
    ? [['/order-history','My orders'], ['/customer/returns','My returns'], ['/demo/workspace','Workspace']]
    : role === 'Vendor'
      ? [['/vendor/orders','Orders'], ['/vendor/returns','Returns'], ['/demo/workspace','Workspace']]
      : [['/admin/orders','Orders'], ['/admin/returns','Returns'], ['/demo/workspace','Workspace']];
  return <header className="demo-return-header"><button onClick={() => navigate('/demo/workspace')}>SellPoint <span>{role.toUpperCase()} DEMO</span></button><nav>{links.map(([path,label]) => <button key={path} onClick={() => navigate(path)}>{label}</button>)}<button onClick={() => { endSession(); navigate('/demo', { replace: true }); }}>Switch role</button></nav></header>;
}

function ReturnPage({ role, title, description, children }) {
  return <main className="demo-return-page"><ReturnHeader role={role}/><section className="demo-return-content"><p className="demo-return-eyebrow">RETURNS & REFUNDS</p><h1>{title}</h1><p className="demo-return-intro">{description}</p>{children}</section></main>;
}

function Status({ value }) {
  const className = value.toLowerCase().replace(/[^a-z]+/g, '-');
  return <span className={`demo-return-status ${className}`}>{value}</span>;
}

export function DemoCustomerReturns() {
  const { session, demoState, updateDemoState } = useDemo();
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const orders = demoState.orders.filter(order => Number(order.customerId) === Number(session.userId));
  const requests = getCustomerDemoReturns(demoState, session.userId);
  const eligibleItems = orders.flatMap(order => (order.items || []).map(item => ({
    order, item, eligibility: getReturnEligibility(demoState, order.orderId, item.orderItemId, session.userId)
  })).filter(entry => entry.eligibility.eligible));
  const submit = (orderId, item) => {
    const draft = drafts[item.orderItemId] || {};
    try {
      updateDemoState(createDemoReturnRequest(demoState, { orderId, orderItemId: item.orderItemId, customerId: session.userId, quantity: draft.quantity || 1, reason: draft.reason || '' }));
      setMessage('Your return request has been submitted to the vendor.');
      setError('');
    } catch (e) { setError(e.message); }
  };
  const escalate = request => {
    const explanation = window.prompt('Why should an administrator review this rejection?') || '';
    try { updateDemoState(escalateDemoReturn(demoState, request.returnId, session.userId, explanation)); setMessage('Your request has been escalated to the admin team.'); setError(''); }
    catch (e) { setError(e.message); }
  };
  return <ReturnPage role="Customer" title="My returns" description="Request a return for an eligible delivered item, track the vendor decision, or ask an administrator to review a rejection.">
    <div className="demo-return-notice">Returns are available within 30 days of delivery. Refunds are simulated and do not transfer real money. Shipping and tax are not included in the refund calculation.</div>
    {message && <p className="demo-return-message" role="status">{message}</p>}{error && <p className="demo-return-error" role="alert">{error}</p>}
    <h2>Eligible order items</h2>
    {eligibleItems.length ? <div className="demo-return-list">{eligibleItems.map(({order,item,eligibility}) => <article key={item.orderItemId}>
      <div className="demo-return-card-heading"><div><strong>{item.productName}</strong><small>Order #{order.orderId} · Delivered {dateLabel(eligibility.deliveredAt)}</small></div><Status value="Eligible"/></div>
      <p>{item.variantName ? `Option: ${item.variantName} · ` : ''}{item.quantity} purchased · {money(item.unitPrice)} per unit · {eligibility.daysRemaining} days left</p>
      <div className="demo-return-form-row"><label>Quantity to return<input type="number" min="1" max={item.quantity} step="1" value={drafts[item.orderItemId]?.quantity ?? 1} onChange={e=>setDrafts({...drafts,[item.orderItemId]:{...drafts[item.orderItemId],quantity:e.target.value}})}/></label><label>Reason<textarea rows="2" value={drafts[item.orderItemId]?.reason || ''} onChange={e=>setDrafts({...drafts,[item.orderItemId]:{...drafts[item.orderItemId],reason:e.target.value}})} placeholder="Tell the vendor why you want to return this item."/></label></div>
      <button className="demo-return-primary" onClick={()=>submit(order.orderId,item)}>Submit return request</button>
    </article>)}</div> : <p className="demo-return-empty">There are no eligible items right now. Try the recent delivered sample order in your order history.</p>}
    <h2>Return history</h2>
    {requests.length ? <div className="demo-return-list">{requests.map(request=><article key={request.returnId}>
      <div className="demo-return-card-heading"><div><strong>{request.productName}</strong><small>Return #{request.returnId} · Order #{request.orderId} · {dateLabel(request.createdAt)}</small></div><Status value={request.status}/></div>
      <p>{request.quantity} of {request.purchasedQuantity} · Refund amount {money(request.refundAmount)} · {request.vendorName}</p><p className="demo-return-reason">Reason: {request.reason}</p>
      {request.refundStatus === 'Simulated refund recorded' && <p className="demo-return-message">Simulated refund recorded: {money(request.refundAmount)}. No payment was transferred.</p>}
      {request.status === 'Rejected' && <button className="demo-return-secondary" onClick={()=>escalate(request)}>Escalate to admin</button>}
      {request.vendorDecision?.notes && <small>Vendor note: {request.vendorDecision.notes}</small>}
      {request.adminDecision?.notes && <small>Admin note: {request.adminDecision.notes}</small>}
    </article>)}</div> : <p className="demo-return-empty">You have not submitted any return requests.</p>}
  </ReturnPage>;
}

export function DemoVendorReturns() {
  const { session, demoState, updateDemoState } = useDemo();
  const [notes, setNotes] = useState({});
  const [restock, setRestock] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const requests = getVendorDemoReturns(demoState, session.vendorId);
  const decide = (request, decision) => {
    try {
      updateDemoState(decideDemoReturnAsVendor(demoState, request.returnId, session.vendorId, decision, { restock: Boolean(restock[request.returnId]), notes: notes[request.returnId] || '' }));
      setMessage(`Return #${request.returnId} ${decision.toLowerCase()}.`); setError('');
    } catch (e) { setError(e.message); }
  };
  return <ReturnPage role="Vendor" title="Return requests" description="Review only returns for products sold by your store. Approvals record a simulated refund; choose whether the returned stock can be resold.">
    {message && <p className="demo-return-message" role="status">{message}</p>}{error && <p className="demo-return-error" role="alert">{error}</p>}
    {requests.length ? <div className="demo-return-list">{requests.map(request=><article key={request.returnId}>
      <div className="demo-return-card-heading"><div><strong>{request.productName}</strong><small>Return #{request.returnId} · Order #{request.orderId} · {request.customerName}</small></div><Status value={request.status}/></div>
      <p>{request.quantity} of {request.purchasedQuantity} · {request.variantName || 'Standard item'} · Refund {money(request.refundAmount)}</p><p className="demo-return-reason">Customer reason: {request.reason}</p>
      {request.status === 'Pending Vendor Review' && <><label className="demo-return-label">Decision notes<textarea rows="2" value={notes[request.returnId] || ''} onChange={e=>setNotes({...notes,[request.returnId]:e.target.value})}/></label><label className="demo-return-check"><input type="checkbox" checked={Boolean(restock[request.returnId])} onChange={e=>setRestock({...restock,[request.returnId]:e.target.checked})}/> Returned item is resellable; restore stock to the purchased variant</label><div className="demo-return-actions"><button className="demo-return-primary" onClick={()=>decide(request,'Approved')}>Approve & record refund</button><button className="demo-return-danger" onClick={()=>decide(request,'Rejected')}>Reject request</button></div></>}
      {request.vendorDecision?.notes && <small>Vendor note: {request.vendorDecision.notes}</small>}
      {request.refundStatus === 'Simulated refund recorded' && <p className="demo-return-message">Simulated refund recorded: {money(request.refundAmount)}.</p>}
    </article>)}</div> : <p className="demo-return-empty">No return requests have been submitted to this store.</p>}
  </ReturnPage>;
}

export function DemoAdminReturns() {
  const { demoState, updateDemoState } = useDemo();
  const [notes, setNotes] = useState({});
  const [restock, setRestock] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const requests = useMemo(() => demoState.returnRequests || [], [demoState.returnRequests]);
  const escalated = requests.filter(request => request.status === 'Escalated');
  const decide = (request, decision) => {
    try {
      updateDemoState(decideDemoReturnAsAdmin(demoState, request.returnId, decision, { restock: Boolean(restock[request.returnId]), notes: notes[request.returnId] || '' }));
      setMessage(`Admin decision saved for return #${request.returnId}.`); setError('');
    } catch (e) { setError(e.message); }
  };
  return <ReturnPage role="Admin" title="Return escalations" description="Review customer escalations after a vendor rejection and record the marketplace's final decision.">
    <div className="demo-return-notice">Only escalated requests can be decided here. An approved request records a simulated refund; no payment provider is contacted.</div>
    {message && <p className="demo-return-message" role="status">{message}</p>}{error && <p className="demo-return-error" role="alert">{error}</p>}
    {escalated.length ? <div className="demo-return-list">{escalated.map(request=><article key={request.returnId}>
      <div className="demo-return-card-heading"><div><strong>{request.productName}</strong><small>Return #{request.returnId} · Order #{request.orderId} · {request.customerName}</small></div><Status value={request.status}/></div>
      <p>{request.quantity} of {request.purchasedQuantity} · {request.variantName || 'Standard item'} · Refund {money(request.refundAmount)}</p><p className="demo-return-reason">Customer reason: {request.reason}</p><p className="demo-return-reason">Escalation: {request.escalation?.explanation || 'No additional explanation provided.'}</p>
      <label className="demo-return-label">Admin decision notes<textarea rows="2" value={notes[request.returnId] || ''} onChange={e=>setNotes({...notes,[request.returnId]:e.target.value})}/></label>
      <label className="demo-return-check"><input type="checkbox" checked={Boolean(restock[request.returnId])} onChange={e=>setRestock({...restock,[request.returnId]:e.target.checked})}/> Returned item is resellable; restore stock to the purchased variant</label>
      <div className="demo-return-actions"><button className="demo-return-primary" onClick={()=>decide(request,'Approved')}>Approve & record refund</button><button className="demo-return-danger" onClick={()=>decide(request,'Rejected')}>Reject escalation</button></div>
    </article>)}</div> : <p className="demo-return-empty">There are no escalated return requests awaiting an admin decision.</p>}
    <h2>All return requests</h2>
    <div className="demo-return-list">{requests.filter(request=>request.status!=='Escalated').map(request=><article key={request.returnId}><div className="demo-return-card-heading"><strong>{request.productName} · #{request.returnId}</strong><Status value={request.status}/></div><p>{request.customerName} · {request.vendorName} · {money(request.refundAmount)}</p></article>)}</div>
  </ReturnPage>;
}
