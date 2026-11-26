import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import {
  getAdminOverview, getAdminReport, getAdminTopProducts, getAdminTopVendors,
  moderateAdminReview, saveAdminCategory, toggleCategoryActive, toggleVendorActive,
  updateAdminDispute, updateAdminOrderStatus, updateVendorApproval
} from './demoAdminService';
import './demoAdmin.css';

const money = value => `$${Number(value || 0).toFixed(2)}`;
const dateLabel = value => value ? new Date(value).toLocaleDateString() : '—';

function AdminHeader({ active }) {
  const navigate = useNavigate();
  const { endSession } = useDemo();
  const leave = () => { endSession(); navigate('/demo', { replace: true }); };
  const links = [
    ['dashboard', 'Overview', '/admin-dashboard'],
    ['vendors', 'Vendors', '/admin/vendors'],
    ['categories', 'Categories', '/admin/categories'],
    ['orders', 'Orders', '/admin/orders'],
    ['disputes', 'Disputes', '/admin/disputes'],
    ['reviews', 'Reviews', '/admin/reviews'],
    ['reports', 'Reports', '/admin/reports']
  ];
  return <header className="demo-admin-header"><button className="demo-admin-brand" onClick={() => navigate('/admin-dashboard')}>SellPoint <span>ADMIN DEMO</span></button><nav>{links.map(([key,label,path]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => navigate(path)}>{label}</button>)}<button onClick={leave}>Switch role</button></nav></header>;
}

function useAdminState() {
  const { demoState, updateDemoState } = useDemo();
  return { demoState, updateDemoState };
}

function AdminPage({ active, eyebrow, title, description, children }) {
  return <main className="demo-admin-page"><AdminHeader active={active}/><section className="demo-admin-content"><div className="demo-admin-page-heading"><div><p className="demo-admin-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></div>{children}</section></main>;
}

function StatCards({ items }) {
  return <div className="demo-admin-stats">{items.map(([label,value,detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>;
}

export function DemoAdminDashboard() {
  const navigate = useNavigate();
  const { demoState } = useAdminState();
  const stats = getAdminOverview(demoState);
  const actions = [
    ['Vendors','Approve applications and manage seller accounts','/admin/vendors','🏪'],
    ['Categories','Organize the marketplace catalogue','/admin/categories','🗂️'],
    ['Orders','Monitor all marketplace orders','/admin/orders','📦'],
    ['Disputes','Review and record dispute decisions','/admin/disputes','⚖️'],
    ['Reviews','Moderate customer product reviews','/admin/reviews','⭐'],
    ['Reports','Explore marketplace sales and trends','/admin/reports','📊']
  ];
  return <AdminPage active="dashboard" eyebrow="MARKETPLACE CONTROL CENTRE" title="Admin dashboard" description="A marketplace-wide overview using fictional SellPoint demo data.">
    <StatCards items={[
      ['Customers',stats.totalCustomers,'Demo customer accounts'],
      ['Vendors',stats.totalVendors,`${stats.approvedVendors} approved · ${stats.pendingVendors} pending`],
      ['Products',stats.totalProducts,`${stats.activeProducts} active listings`],
      ['Orders',stats.totalOrders,`${stats.pendingOrders} pending or processing`],
      ['Marketplace sales',money(stats.totalRevenue),'Excludes cancelled and refunded orders'],
      ['Open disputes',stats.openDisputes,'Need admin attention'],
      ['Pending reviews',stats.pendingReviews,'Awaiting moderation'],
      ['Pending vendors',stats.pendingVendors,'Awaiting approval']
    ]}/>
    <div className="demo-admin-section-heading"><h2>Administration</h2><p>Choose an area to manage the demo marketplace.</p></div>
    <div className="demo-admin-action-grid">{actions.map(([label,desc,path,icon]) => <button key={path} onClick={() => navigate(path)}><span>{icon}</span><strong>{label}</strong><small>{desc}</small></button>)}</div>
  </AdminPage>;
}

export function DemoAdminVendors() {
  const { demoState, updateDemoState } = useAdminState();
  const [filter,setFilter] = useState('All');
  const [message,setMessage] = useState('');
  const filtered = demoState.vendors.filter(v => filter === 'All' || v.status === filter || (filter === 'Suspended' && v.status === 'Approved' && !v.isActive));
  const decide = (id,status) => { try { updateDemoState(updateVendorApproval(demoState,id,status)); setMessage(`Vendor ${status.toLowerCase()}.`); } catch(e) { setMessage(e.message); } };
  const toggle = id => { try { updateDemoState(toggleVendorActive(demoState,id)); setMessage('Vendor status updated.'); } catch(e) { setMessage(e.message); } };
  return <AdminPage active="vendors" eyebrow="SELLER ACCOUNTS" title="Vendor management" description="Review vendor applications and manage approved seller accounts.">
    <div className="demo-admin-toolbar"><div className="demo-admin-filter">{['All','Pending','Approved','Rejected','Suspended'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
    {message && <p className="demo-admin-message" role="status">{message}</p>}
    <div className="demo-admin-table-wrap"><table className="demo-admin-table"><thead><tr><th>Business</th><th>Owner</th><th>Email</th><th>Joined</th><th>Approval</th><th>Account</th><th>Actions</th></tr></thead><tbody>
      {filtered.map(v=><tr key={v.vendorId}><td><strong>{v.businessName}</strong><small>Vendor #{v.vendorId}</small></td><td>{v.ownerName}</td><td>{v.email}</td><td>{dateLabel(v.joinedAt)}</td><td><span className={`demo-admin-pill ${v.status.toLowerCase()}`}>{v.status}</span></td><td>{v.status==='Approved'?(v.isActive?'Active':'Suspended'):'—'}</td><td><div className="demo-admin-row-actions">{v.status==='Pending'&&<><button onClick={()=>decide(v.vendorId,'Approved')}>Approve</button><button className="danger" onClick={()=>decide(v.vendorId,'Rejected')}>Reject</button></>}{v.status==='Approved'&&<button onClick={()=>toggle(v.vendorId)}>{v.isActive?'Suspend':'Activate'}</button>}{v.status==='Rejected'&&<button onClick={()=>decide(v.vendorId,'Approved')}>Approve</button>}</div></td></tr>)}
    </tbody></table></div>
  </AdminPage>;
}

const emptyCategory = {categoryName:'',description:''};
export function DemoAdminCategories() {
  const {demoState,updateDemoState}=useAdminState();
  const [form,setForm]=useState(emptyCategory);
  const [editing,setEditing]=useState(null);
  const [error,setError]=useState('');
  const [showForm,setShowForm]=useState(false);
  const [showInactive,setShowInactive]=useState(true);
  const categories=demoState.categories.filter(c=>showInactive||c.isActive);
  const openEdit=c=>{setEditing(c.categoryId);setForm({categoryName:c.categoryName,description:c.description||''});setError('');setShowForm(true);};
  const submit=e=>{e.preventDefault();try{updateDemoState(saveAdminCategory(demoState,form,editing));setForm(emptyCategory);setEditing(null);setShowForm(false);setError('');}catch(err){setError(err.message);}};
  const toggle=id=>{try{updateDemoState(toggleCategoryActive(demoState,id));setError('');}catch(err){setError(err.message);}};
  return <AdminPage active="categories" eyebrow="CATALOGUE STRUCTURE" title="Category management" description="Create and maintain categories used by customer product browsing and vendor listings.">
    <div className="demo-admin-toolbar"><button className="demo-admin-primary" onClick={()=>{setEditing(null);setForm(emptyCategory);setShowForm(true);}}>+ Add category</button><button onClick={()=>setShowInactive(v=>!v)}>{showInactive?'Show active only':'Show inactive too'}</button></div>
    {error&&<p className="demo-admin-error" role="alert">{error}</p>}
    {showForm&&<form className="demo-admin-form" onSubmit={submit}><div className="demo-admin-form-heading"><h2>{editing?'Edit category':'New category'}</h2><button type="button" onClick={()=>setShowForm(false)}>Close</button></div><label>Category name<input required value={form.categoryName} onChange={e=>setForm({...form,categoryName:e.target.value})}/></label><label>Description<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="demo-admin-form-actions"><button className="demo-admin-primary" type="submit">Save category</button><button type="button" onClick={()=>setShowForm(false)}>Cancel</button></div></form>}
    <div className="demo-admin-table-wrap"><table className="demo-admin-table"><thead><tr><th>Category</th><th>Description</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead><tbody>{categories.map(c=><tr key={c.categoryId}><td><strong>{c.categoryName}</strong></td><td>{c.description||'—'}</td><td>{demoState.products.filter(p=>p.categoryId===c.categoryId).length}</td><td><span className={`demo-admin-pill ${c.isActive?'approved':'rejected'}`}>{c.isActive?'Active':'Inactive'}</span></td><td><div className="demo-admin-row-actions"><button onClick={()=>openEdit(c)}>Edit</button><button onClick={()=>toggle(c.categoryId)}>{c.isActive?'Deactivate':'Activate'}</button></div></td></tr>)}</tbody></table></div>
  </AdminPage>;
}

export function DemoAdminOrders() {
  const {demoState,updateDemoState}=useAdminState();
  const [filter,setFilter]=useState('All');
  const [selected,setSelected]=useState(null);
  const [message,setMessage]=useState('');
  const orders=demoState.orders.filter(o=>filter==='All'||o.orderStatus===filter).slice().sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate));
  const change=(id,status)=>{try{updateDemoState(updateAdminOrderStatus(demoState,id,status));setSelected(null);setMessage('Order status updated.');}catch(e){setMessage(e.message);}};
  return <AdminPage active="orders" eyebrow="MARKETPLACE FULFILMENT" title="Order management" description="View all marketplace orders and update their overall status.">
    <div className="demo-admin-filter">{['All','Pending','Processing','Shipped','Delivered','Cancelled'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    {message&&<p className="demo-admin-message" role="status">{message}</p>}
    <div className="demo-admin-table-wrap"><table className="demo-admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead><tbody>{orders.map(o=><tr key={o.orderId}><td>#{o.orderId}</td><td>{o.customerName}</td><td>{dateLabel(o.orderDate)}</td><td>{o.items?.length||0}</td><td>{money(o.totalAmount)}</td><td><span className="demo-admin-pill">{o.orderStatus}</span></td><td>{o.paymentStatus}</td><td><button onClick={()=>setSelected(o)}>Manage</button></td></tr>)}</tbody></table></div>
    {selected&&<div className="demo-admin-modal-backdrop" onClick={()=>setSelected(null)}><section className="demo-admin-modal" onClick={e=>e.stopPropagation()}><div className="demo-admin-form-heading"><h2>Order #{selected.orderId}</h2><button onClick={()=>setSelected(null)}>×</button></div><p><strong>Customer:</strong> {selected.customerName}</p><p><strong>Date:</strong> {dateLabel(selected.orderDate)}</p><h3>Items</h3>{selected.items?.map(item=><p key={item.orderItemId}>{item.productName} · {item.quantity} × {money(item.unitPrice)} · {money(item.itemTotal)}</p>)}<p><strong>Order total:</strong> {money(selected.totalAmount)}</p><label>Update order status<select defaultValue={selected.orderStatus} onChange={e=>setSelected({...selected,nextStatus:e.target.value})}>{['Pending','Processing','Shipped','Delivered','Cancelled'].map(x=><option key={x}>{x}</option>)}</select></label><div className="demo-admin-form-actions"><button className="demo-admin-primary" onClick={()=>change(selected.orderId,selected.nextStatus||selected.orderStatus)}>Save status</button><button onClick={()=>setSelected(null)}>Close</button></div></section></div>}
  </AdminPage>;
}

export function DemoAdminDisputes() {
  const {demoState,updateDemoState}=useAdminState();
  const [selected,setSelected]=useState(null);
  const [notes,setNotes]=useState('');
  const [status,setStatus]=useState('Resolved');
  const [error,setError]=useState('');
  const [filter,setFilter]=useState('All');
  const disputes=demoState.disputes.filter(d=>filter==='All'||d.status===filter);
  const open=d=>{setSelected(d);setNotes(d.adminNotes||'');setStatus(d.status==='Open'?'Under Review':d.status);setError('');};
  const save=()=>{try{updateDemoState(updateAdminDispute(demoState,selected.disputeId,status,notes));setSelected(null);setError('');}catch(e){setError(e.message);}};
  return <AdminPage active="disputes" eyebrow="CUSTOMER & SELLER SUPPORT" title="Dispute management" description="Review reported order issues and record an administrative decision.">
    <div className="demo-admin-filter">{['All','Open','Under Review','Resolved','Rejected'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    {error&&<p className="demo-admin-error">{error}</p>}
    <div className="demo-admin-table-wrap"><table className="demo-admin-table"><thead><tr><th>Dispute</th><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>{disputes.map(d=>{const customer=demoState.customers.find(c=>c.userId===d.customerId);return <tr key={d.disputeId}><td>#{d.disputeId}</td><td>#{d.orderId}</td><td>{customer?.name||'Demo user'}</td><td>{d.reason}</td><td><span className="demo-admin-pill">{d.status}</span></td><td>{dateLabel(d.createdAt)}</td><td><button onClick={()=>open(d)}>Review</button></td></tr>;})}</tbody></table></div>
    {selected&&<div className="demo-admin-modal-backdrop" onClick={()=>setSelected(null)}><section className="demo-admin-modal" onClick={e=>e.stopPropagation()}><div className="demo-admin-form-heading"><h2>Dispute #{selected.disputeId}</h2><button onClick={()=>setSelected(null)}>×</button></div><p><strong>Order:</strong> #{selected.orderId}</p><p><strong>Reason:</strong> {selected.reason}</p><label>Decision<select value={status} onChange={e=>setStatus(e.target.value)}><option>Under Review</option><option>Resolved</option><option>Rejected</option></select></label><label>Admin notes<textarea rows="4" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Record the decision and reasoning."/></label><div className="demo-admin-form-actions"><button className="demo-admin-primary" onClick={save}>Save decision</button><button onClick={()=>setSelected(null)}>Cancel</button></div></section></div>}
  </AdminPage>;
}

export function DemoAdminReviews() {
  const {demoState,updateDemoState}=useAdminState();
  const [filter,setFilter]=useState('Pending');
  const [message,setMessage]=useState('');
  const reviews=demoState.reviews.filter(r=>filter==='All'||r.status===filter);
  const decide=(id,status)=>{try{updateDemoState(moderateAdminReview(demoState,id,status));setMessage(`Review ${status.toLowerCase()}.`);}catch(e){setMessage(e.message);}};
  return <AdminPage active="reviews" eyebrow="CONTENT MODERATION" title="Review moderation" description="Approve or reject customer-submitted product reviews.">
    <div className="demo-admin-filter">{['Pending','Approved','Rejected','All'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    {message&&<p className="demo-admin-message" role="status">{message}</p>}
    <div className="demo-admin-review-list">{reviews.map(r=><article key={r.reviewId}><div><strong>{r.productName}</strong><span>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span><small>{r.customerName} · {dateLabel(r.createdAt)}</small></div><p>{r.comment||'No comment provided.'}</p><div className="demo-admin-review-actions"><span className="demo-admin-pill">{r.status}</span>{r.status==='Pending'&&<><button onClick={()=>decide(r.reviewId,'Approved')}>Approve</button><button className="danger" onClick={()=>decide(r.reviewId,'Rejected')}>Reject</button></>}</div></article>)}</div>
  </AdminPage>;
}

export function DemoAdminReports() {
  const {demoState}=useAdminState();
  const [grouping,setGrouping]=useState('monthly');
  const [fromDate,setFromDate]=useState('2026-01-01');
  const [toDate,setToDate]=useState('2026-12-31');
  const report=useMemo(()=>getAdminReport(demoState,fromDate,toDate,grouping),[demoState,fromDate,toDate,grouping]);
  const topProducts=getAdminTopProducts(demoState);
  const topVendors=getAdminTopVendors(demoState);
  const overview=getAdminOverview(demoState);
  const max=Math.max(1,...report.map(row=>row.totalRevenue));
  const exportCsv=()=>{
    const rows=[['Period','Orders','Revenue','Subtotal','Shipping','Tax','Average order value'],...report.map(r=>[r.period,r.totalOrders,r.totalRevenue,r.totalSubTotal,r.totalShipping,r.totalTax,r.averageOrderValue])];
    const csv=rows.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(',')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const link=document.createElement('a');link.href=url;link.download='sellpoint_demo_sales_report.csv';link.click();URL.revokeObjectURL(url);
  };
  return <AdminPage active="reports" eyebrow="MARKETPLACE PERFORMANCE" title="Reports & analytics" description="Explore sales activity and marketplace performance using the current demo dataset.">
    <StatCards items={[['Total sales',money(overview.totalRevenue),'Excludes cancelled and refunded orders'],['Total orders',overview.totalOrders,'All demo orders'],['Active vendors',demoState.vendors.filter(v=>v.status==='Approved'&&v.isActive).length,'Approved and active'],['Active products',overview.activeProducts,'Visible catalogue products']]}/>
    <div className="demo-admin-report-toolbar"><div className="demo-admin-filter">{[['daily','Daily'],['monthly','Monthly'],['yearly','Yearly']].map(([key,label])=><button key={key} className={grouping===key?'active':''} onClick={()=>setGrouping(key)}>{label}</button>)}</div><label>From <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label>To <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label><button onClick={exportCsv}>Export CSV</button><button onClick={()=>window.print()}>Print</button></div>
    {fromDate>toDate&&<p className="demo-admin-error">The start date must be earlier than or equal to the end date.</p>}
    <section className="demo-admin-report-card"><h2>Sales by {grouping === 'daily'?'day':grouping==='yearly'?'year':'month'}</h2>{report.length===0||fromDate>toDate?<p>No sales records for this date range.</p>:<div className="demo-admin-chart">{report.map(row=><div key={row.period}><strong>{money(row.totalRevenue)}</strong><span style={{height:`${Math.max(8,row.totalRevenue/max*170)}px`}}/><small>{row.period}</small></div>)}</div>}</section>
    <div className="demo-admin-report-columns"><section className="demo-admin-report-card"><h2>Top products</h2>{topProducts.map(p=><p key={p.productId}><strong>{p.productName}</strong><span>{p.unitsSold} sold · {money(p.revenue)}</span></p>)}</section><section className="demo-admin-report-card"><h2>Top vendors</h2>{topVendors.map(v=><p key={v.vendorId}><strong>{v.businessName}</strong><span>{v.unitsSold} sold · {money(v.revenue)}</span></p>)}</section></div>
    <section className="demo-admin-report-card"><h2>Sales report details</h2><div className="demo-admin-table-wrap"><table className="demo-admin-table"><thead><tr><th>Period</th><th>Orders</th><th>Revenue</th><th>Subtotal</th><th>Shipping</th><th>Average order</th></tr></thead><tbody>{report.map(r=><tr key={r.period}><td>{r.period}</td><td>{r.totalOrders}</td><td>{money(r.totalRevenue)}</td><td>{money(r.totalSubTotal)}</td><td>{money(r.totalShipping)}</td><td>{money(r.averageOrderValue)}</td></tr>)}</tbody></table></div></section>
  </AdminPage>;
}
