import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from './DemoProvider';
import { getDemoNotifications, markAllDemoNotificationsRead, markDemoNotificationRead } from './demoNotificationService';
import './demoNotifications.css';

export function DemoNotificationCenter() {
  const { session, demoState, updateDemoState } = useDemo();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notifications = useMemo(() => getDemoNotifications(demoState, session), [demoState, session]);
  const unreadCount = notifications.filter(item => !item.isRead).length;

  if (!session) return null;

  const openNotification = notification => {
    updateDemoState(markDemoNotificationRead(demoState, notification.notificationId, session));
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = () => updateDemoState(markAllDemoNotificationsRead(demoState, session));

  return (
    <div className="demo-notification-center">
      <button className="demo-notification-trigger" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span aria-hidden="true">♧</span> Notifications
        {unreadCount > 0 && <span className="demo-notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <section className="demo-notification-panel" aria-label="Notifications">
        <header><div><h2>Notifications</h2><p>{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div>
          <button type="button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>
        </header>
        <div className="demo-notification-list">
          {notifications.length === 0 ? <p className="demo-notification-empty">No notifications yet. Marketplace activity will appear here.</p> :
            notifications.map(item => <button type="button" key={item.notificationId} className={`demo-notification-item ${item.isRead ? 'read' : 'unread'}`} onClick={() => openNotification(item)}>
              <span className="demo-notification-dot" aria-hidden="true" />
              <span className="demo-notification-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small></span>
            </button>)}
        </div>
      </section>}
    </div>
  );
}
