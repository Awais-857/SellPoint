import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { useTheme } from '../theme/ThemeProvider';
import './DemoDashboardChrome.css';

const navigation = {
  vendor: [
    { key: 'dashboard', label: 'Overview', path: '/vendor-dashboard', icon: 'layout' },
    { key: 'products', label: 'Products', path: '/vendor/products', icon: 'package' },
    { key: 'store', label: 'Store profile', path: '/vendor/store-profile', icon: 'store' },
    { key: 'orders', label: 'Orders', path: '/vendor/orders', icon: 'orders' },
    { key: 'reviews', label: 'Reviews', path: '/vendor/reviews', icon: 'star' },
    { key: 'returns', label: 'Returns', path: '/vendor/returns', icon: 'return' },
    { key: 'revenue', label: 'Revenue', path: '/vendor/revenue', icon: 'chart' }
  ],
  admin: [
    { key: 'dashboard', label: 'Overview', path: '/admin-dashboard', icon: 'layout' },
    { key: 'vendors', label: 'Vendors', path: '/admin/vendors', icon: 'users' },
    { key: 'products', label: 'Products', path: '/admin/products', icon: 'package' },
    { key: 'categories', label: 'Categories', path: '/admin/categories', icon: 'grid' },
    { key: 'orders', label: 'Orders', path: '/admin/orders', icon: 'orders' },
    { key: 'payments', label: 'Payments', path: '/admin/payments', icon: 'wallet' },
    { key: 'coupons', label: 'Coupons', path: '/admin/coupons', icon: 'tag' },
    { key: 'disputes', label: 'Disputes', path: '/admin/disputes', icon: 'scale' },
    { key: 'reviews', label: 'Reviews', path: '/admin/reviews', icon: 'star' },
    { key: 'returns', label: 'Returns', path: '/admin/returns', icon: 'return' },
    { key: 'reports', label: 'Reports', path: '/admin/reports', icon: 'chart' }
  ]
};

const iconPaths = {
  layout: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
  package: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/></>,
  store: <><path d="M3 10h18l-1.4-6H4.4L3 10Z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
  orders: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>,
  return: <><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18"/><path d="M16 14h2"/></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
  scale: <><path d="m16 3 5 5-5 5"/><path d="M21 8H9a6 6 0 0 0 0 12h2"/><path d="M8 3 3 8l5 5"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>
};

function Icon({ name, size = 19 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name] || iconPaths.layout}</svg>;
}

export function DemoDashboardChrome({ role, active }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, endSession } = useDemo();
  const { theme, toggleTheme } = useTheme();
  const items = navigation[role] || [];
  const roleLabel = role === 'admin' ? 'Admin' : 'Vendor';
  const displayName = session?.displayName || (role === 'admin' ? 'Marketplace admin' : 'Vendor workspace');
  const leave = () => { endSession(); navigate('/demo', { replace: true }); };
  const go = path => { navigate(path); setMobileOpen(false); };

  return (
    <div className={`demo-dashboard-chrome ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} data-collapsed={collapsed ? 'true' : 'false'}>
      <header className="demo-dashboard-topbar">
        <button type="button" className="demo-dashboard-menu" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(value => !value)}>
          <Icon name={mobileOpen ? 'close' : 'menu'} />
        </button>
        <button type="button" className="demo-dashboard-logo" onClick={() => go(role === 'admin' ? '/admin-dashboard' : '/vendor-dashboard')}>
          <span className="demo-dashboard-logo-mark">S</span>
          <span>SellPoint</span>
          <small>{roleLabel} demo</small>
        </button>
        <div className="demo-dashboard-topbar-spacer" />
        <span className="demo-dashboard-greeting">Hello, {displayName}</span>
        <button type="button" className="demo-dashboard-icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>
        <button type="button" className="demo-dashboard-account" onClick={() => go('/demo/workspace')} title="Open demo workspace">
          <span className="demo-dashboard-avatar">{role === 'admin' ? 'A' : 'V'}</span>
          <span>Workspace</span>
          <Icon name="chevron" size={15} />
        </button>
        <button type="button" className="demo-dashboard-logout" onClick={leave} title="Switch demo role">
          <Icon name="logout" size={17} />
          <span>Switch role</span>
        </button>
      </header>
      <aside className="demo-dashboard-sidebar" aria-label={`${roleLabel} navigation`}>
        <div className="demo-dashboard-sidebar-heading">{roleLabel} workspace</div>
        <nav>
          {items.map(item => {
            const isActive = active === item.key || location.pathname === item.path;
            return <button type="button" key={item.key} className={isActive ? 'active' : ''} onClick={() => go(item.path)} title={collapsed ? item.label : undefined} aria-current={isActive ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>;
          })}
        </nav>
        <div className="demo-dashboard-sidebar-footer">
          <button type="button" onClick={() => go('/demo/workspace')} title={collapsed ? 'Demo workspace' : undefined}>
            <Icon name="layout" /><span>Demo workspace</span>
          </button>
          <button type="button" onClick={leave} title={collapsed ? 'Switch role' : undefined}>
            <Icon name="logout" /><span>Switch role</span>
          </button>
        </div>
      </aside>
      {mobileOpen && <button type="button" className="demo-dashboard-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <button type="button" className="demo-dashboard-collapse" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <Icon name="chevron" size={15} />
      </button>
    </div>
  );
}
