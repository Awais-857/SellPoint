import React from 'react';
import './StatusBadge.css';

const STATUS_TONES = {
  approved: 'success',
  active: 'success',
  delivered: 'success',
  paid: 'success',
  completed: 'success',
  resolved: 'success',
  accepted: 'success',
  pending: 'warning',
  processing: 'warning',
  'under review': 'warning',
  reviewing: 'warning',
  shipped: 'info',
  published: 'info',
  refunded: 'info',
  rejected: 'danger',
  failed: 'danger',
  cancelled: 'danger',
  canceled: 'danger',
  declined: 'danger',
  draft: 'neutral',
  inactive: 'neutral',
  archived: 'neutral',
};

function getStatusTone(status, tone) {
  if (tone) return tone;

  const normalizedStatus = String(status || '').trim().toLowerCase();
  return STATUS_TONES[normalizedStatus] || 'neutral';
}

export default function StatusBadge({ status, tone, className = '' }) {
  if (status === null || status === undefined || status === '') return null;

  const resolvedTone = getStatusTone(status, tone);
  const classes = ['sp-status-badge', `sp-status-badge--${resolvedTone}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="status">
      {status}
    </span>
  );
}
