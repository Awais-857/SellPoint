import React from 'react';
import './ui.css';

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', children, ...props }) {
  return <button type={type} className={`sp-button sp-button-${variant} sp-button-${size} ${className}`.trim()} {...props}>{children}</button>;
}

export function Card({ className = '', children, ...props }) {
  return <section className={`sp-card ${className}`.trim()} {...props}>{children}</section>;
}

export function Alert({ tone = 'info', className = '', children, ...props }) {
  return <div role="status" className={`sp-alert sp-alert-${tone} ${className}`.trim()} {...props}>{children}</div>;
}

export function EmptyState({ title, description, action, className = '' }) {
  return <div className={`sp-empty-state ${className}`.trim()}><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="sp-page-heading"><div>{eyebrow && <p className="sp-page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="sp-page-description">{description}</p>}</div>{action && <div className="sp-page-action">{action}</div>}</div>;
}

export function DataTable({ columns, rows, rowKey = 'id', emptyMessage = 'No records found.', className = '' }) {
  if (!rows.length) return <EmptyState title={emptyMessage} />;
  return <div className="sp-table-wrap"><table className={`sp-table ${className}`.trim()}><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index) => <tr key={row[rowKey] ?? index}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}
