import React from 'react';
import { Chip, Box } from '@mui/material';

// One status → color mapping used consistently across every Backhaul-Match
// portal: soft tinted backgrounds with a matching dot.
const TONES = {
  AVAILABLE: { fg: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  COMPLETED: { fg: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  ACCEPTED: { fg: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  PAID: { fg: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  DELIVERED: { fg: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  IN_TRANSIT: { fg: '#0284C7', bg: 'rgba(2,132,199,0.12)' },
  MATCHED: { fg: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  SCHEDULED: { fg: '#64748B', bg: 'rgba(100,116,139,0.14)' },
  BOOKED: { fg: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  PROCESSING: { fg: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  PENDING: { fg: '#D97706', bg: 'rgba(217,119,6,0.14)' },
  RESERVED: { fg: '#F59E0B', bg: 'rgba(245,158,11,0.16)' },
  PENDING_CONFIRMATION: { fg: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  RECOMMENDED: { fg: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  AWAITING: { fg: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  FAILED: { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  CANCELLED: { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  REJECTED: { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  EXPIRED: { fg: '#94A3B8', bg: 'rgba(148,163,184,0.16)' },
};

const FALLBACK = { fg: '#64748B', bg: 'rgba(100,116,139,0.12)' };

/**
 * Colored status badge. `label` defaults to the status itself; unknown
 * statuses get a neutral gray tone.
 */
export default function StatusChip({ status, label, size = 'small', sx }) {
  const key = String(status || '').toUpperCase();
  const tone = TONES[key] || FALLBACK;
  return (
    <Chip
      size={size}
      label={label || status}
      icon={
        <Box
          sx={{
            width: size === 'small' ? 7 : 9,
            height: size === 'small' ? 7 : 9,
            borderRadius: '50%',
            backgroundColor: tone.fg,
            ml: size === 'small' ? 1 : 1.5,
          }}
        />
      }
      sx={{
        backgroundColor: tone.bg,
        color: tone.fg,
        fontWeight: 700,
        '& .MuiChip-label': { px: size === 'small' ? 1 : 1.5 },
        ...sx,
      }}
    />
  );
}