// Same status -> color mapping as StatusChip's TONES, exposed as plain hex
// values so chart bars/slices (recharts) match the status chips used
// everywhere else in the portal — a "REJECTED" bar and a "REJECTED" chip
// are always the same red.
const COLORS = {
  AVAILABLE: '#16A34A',
  COMPLETED: '#16A34A',
  ACCEPTED: '#16A34A',
  PAID: '#16A34A',
  DELIVERED: '#0D9488',
  IN_TRANSIT: '#0284C7',
  MATCHED: '#2563EB',
  SCHEDULED: '#64748B',
  IN_PROGRESS: '#2563EB',
  BOOKED: '#7C3AED',
  PROCESSING: '#7C3AED',
  PENDING: '#D97706',
  RESERVED: '#F59E0B',
  CONFIRMED: '#16A34A',
  PENDING_CONFIRMATION: '#EA580C',
  RECOMMENDED: '#2563EB',
  AWAITING: '#EA580C',
  FAILED: '#DC2626',
  CANCELLED: '#DC2626',
  REJECTED: '#DC2626',
  RELEASED: '#94A3B8',
  EXPIRED: '#94A3B8',
  OFF_DUTY: '#94A3B8',
  ON_TRIP: '#2563EB',
  MAINTENANCE: '#D97706',
  NO_MATCH: '#DC2626',
};

const FALLBACK_PALETTE = ['#0284C7', '#7C3AED', '#FFB020', '#0D9488', '#DC2626', '#16A34A'];

export function statusColor(status, index = 0) {
  const key = String(status || '').toUpperCase();
  return COLORS[key] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}
