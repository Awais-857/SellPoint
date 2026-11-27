import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { useTheme } from '../theme/ThemeProvider';
import {
  ChartLine,
  ChevronRight,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  RotateCcw,
  Scale,
  Star,
  Store,
  Sun,
  Tag,
  Users,
  Wallet,
  X
} from 'lucide-react';
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

const iconComponents = {
  layout: LayoutDashboard,
  package: Package,
  store: Store,
  orders: ClipboardList,
  star: Star,
  return: RotateCcw,
  chart: ChartLine,
  users: Users,
  grid: Grid2X2,
  wallet: Wallet,
  tag: Tag,
  scale: Scale,
  menu: Menu,
  close: X,
  sun: Sun,
  moon: Moon,
  chevron: ChevronRight,
  logout: LogOut
};

function Icon({ name, size = 19 }) {
  const IconComponent = iconComponents[name] || LayoutDashboard;
  return <IconComponent aria-hidden="true" size={size} strokeWidth={1.8} />;
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
