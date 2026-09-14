import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Divider, Grid, MenuItem, Paper, Select,
  Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import PaidRounded from '@mui/icons-material/PaidRounded';
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import RouteRounded from '@mui/icons-material/RouteRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import { getTrips } from '../api/tripApi';
import { getTrucks } from '../api/truckApi';
import { getMyAvailability } from '../api/availabilityApi';
import { getMyBookingInvoices } from '../api/revenueApi';
import EmptyState from '../ui/EmptyState';
import StatusChip from '../ui/StatusChip';
import Donut from '../ui/charts/Donut';
import VerticalBars from '../ui/charts/VerticalBars';

const C = {
  navy: '#0B2447',
  blue: '#2563EB',
  indigo: '#3B82F6',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  slate: '#94A3B8',
};

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ---------------- formatting helpers ---------------- */

const money = (n) => `LKR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const moneyCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
};
const ton = (n) => `${String(Number(n) || 0).replace(/\.0+$/, '')} ton`;
const toDate = (v) => (v ? new Date(v) : null);
const fmtDate = (d) => (d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/* ---------------- range boundaries ---------------- */

function rangeBounds(range, from, to) {
  const now = new Date();
  const eod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  switch (range) {
    case 'today': {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: s, end: eod(now) };
    }
    case 'week': {
      const day = (now.getDay() + 6) % 7; // Monday start
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      return { start: s, end: eod(now) };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: eod(now) };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: eod(now) };
    case 'custom': {
      const start = new Date(from || `${now.getFullYear()}-01-01`);
      const end = eod(to ? new Date(to) : now);
      if (start.getTime() > end.getTime()) return { start: end, end: start, inverted: true };
      return { start, end };
    }
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: eod(now) };
  }
}

const isIn = (d, start, end) => {
  if (!d) return true; // dateless upcoming trips count in the current period
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
};

function monthBuckets(start, end) {
  const out = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur.getTime() <= end.getTime()) {
    out.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

const inBucket = (d, bucket) => d &&
  d.getFullYear() === bucket.getFullYear() && d.getMonth() === bucket.getMonth();

/* ---------------- tiny chart/status bits ---------------- */

const TrendChip = ({ delta }) => {
  const up = (delta || 0) >= 0;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.25,
        borderRadius: 1.25, fontWeight: 700, fontSize: 11.5, lineHeight: 1.6,
        color: up ? '#15803D' : '#B91C1C',
        bgcolor: up ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)',
      }}
    >
      {up ? <TrendingUp sx={{ fontSize: 13 }} /> : <TrendingDown sx={{ fontSize: 13 }} />}
      {Math.abs(delta).toFixed(1)}%
    </Box>
  );
};

const MetricCard = ({ title, icon, value, sub, accent = C.blue, delta, rest }) => (
  <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #E5EAF2', transition: 'transform .18s ease, box-shadow .18s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 26px rgba(11,36,71,0.10)' } }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.05em' }} color="text.secondary">
        {title}
      </Typography>
      <Box sx={{ width: 40, height: 40, borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: '#fff' }}>
        {icon}
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: 34, lineHeight: 1.05, color: C.navy, letterSpacing: '-0.01em' }}>
      {value}
    </Typography>
    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      {delta != null && <TrendChip delta={delta} />}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{sub}</Typography>
    </Box>
    {rest}
  </Paper>
);

const SegBar = ({ segs, height = 14 }) => (
  <Box sx={{ display: 'flex', gap: 3, height, borderRadius: 2, overflow: 'hidden', bgcolor: '#EEF2F7' }}>
    {segs.map((s) => (
      <Box key={s.color} sx={{ width: `${percentage(s.value, s.total)}%`, minWidth: 4, bgcolor: s.color }} />
    ))}
  </Box>
);

const Legend = ({ items }) => (
  <Stack spacing={0.75} sx={{ mt: 2 }}>
    {items.map((it) => (
      <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: it.color }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{it.label}</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B2447' }}>
          {it.value} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{it.pct}%</Typography>
        </Typography>
      </Box>
    ))}
  </Stack>
);

const PayChip = ({ status }) => {
  if (!status) return <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>—</Typography>;
  const tone = status === 'PAID' ? { fg: '#16A34A', bg: 'rgba(22,163,74,0.12)' }
    : status === 'PENDING' ? { fg: '#D97706', bg: 'rgba(217,119,6,0.14)' }
    : { fg: '#DC2626', bg: 'rgba(220,38,38,0.10)' };
  return (
    <Chip size="small" label={status} sx={{ backgroundColor: tone.bg, color: tone.fg, fontWeight: 700, fontSize: '0.72rem' }} />
  );
};

const percentage = (part, total) => (total > 0 ? Math.max(0, Math.min(100, (Number(part) / Number(total)) * 100)) : 0);

/* ---------------- main page ---------------- */

export default function Reports() {
  const navigate = useNavigate();
  const [range, setRange] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const exported = useRef(new Date());

  const load = () => {
    setLoading(true);
    setError('');
    Promise.allSettled([getTrips(), getTrucks(), getMyAvailability(), getMyBookingInvoices()]).then(([t, tk, a, i]) => {
      const failed = [t, tk, a, i].filter((r) => r.status === 'rejected');
      if (failed.length) {
        setError('Could not load reports data (are fleet-service and payment-service running?)');
        setData(null);
      } else {
        setData({
          trips: t.value || [],
          trucks: tk.value || [],
          availability: a.value || [],
          invoices: i.value || [],
        });
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const model = useMemo(() => {
    if (!data) return null;
    const { trips, trucks, availability, invoices } = data;
    const bounds = rangeBounds(range, from, to);
    const { start, end } = bounds;
    const inverted = bounds.inverted;
    const durMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const trucksById = new Map(trucks.map((t) => [t.id, t]));
    const availByTruck = new Map();
    availability.forEach((a) => {
      const list = availByTruck.get(a.truckId) || [];
      list.push(a);
      availByTruck.set(a.truckId, list);
    });
    const invByShipment = new Map();
    invoices.forEach((i) => { if (i.shipmentId != null) invByShipment.set(i.shipmentId, i); });

    const isOverdue = (inv) => {
      const d = toDate(inv.paidAt || inv.createdAt);
      return d && (Date.now() - d.getTime()) > 30 * 24 * 3600 * 1000;
    };

    const enrichTrip = (trip) => {
      const truck = trucksById.get(trip.truckId);
      const avails = availByTruck.get(trip.truckId) || [];
      const avail = avails[0]; // list is ordered latest-first
      const inv = invByShipment.get(trip.shipmentId);
      const date = toDate(trip.startTime || trip.endTime || (avail && avail.availableFrom));
      const tripStatus = String(trip.status || '');
      let paymentStatus = null;
      if (inv) {
        if (inv.status === 'PAID') paymentStatus = 'PAID';
        else paymentStatus = isOverdue(inv) ? 'OVERDUE' : 'PENDING';
      }
      return {
        ...trip,
        truckNo: truck ? truck.truckNo : '—',
        capacityUsed: avail ? avail.availableCapacityTon : (truck ? truck.capacityTon : null),
        route: avail && avail.routeFrom && avail.routeTo ? `${avail.routeFrom} → ${avail.routeTo}` : null,
        date,
        dateLabel: fmtDate(date),
        revenue: inv ? Number(inv.amount) || 0 : 0,
        paymentStatus,
        tripStatus,
        invoice: inv || null,
      };
    };
    const enriched = trips.map(enrichTrip);
    const inPeriod = enriched.filter((e) => isIn(e.date, start, end)) || [];
    const prevCount = enriched.filter((e) => e.date && isIn(e.date, prevStart, prevEnd)).length;
    const totalTrips = inPeriod.length;
    const tripDelta = prevCount > 0 ? ((totalTrips - prevCount) / prevCount) * 100 : null;

    const invDate = (inv) => toDate((inv.status === 'PAID' ? inv.paidAt : null) || inv.createdAt);
    const paidInvoices = invoices.filter((i) => i.status === 'PAID' && isIn(invDate(i), start, end));
    const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' && isIn(invDate(i), start, end));
    const paidCount = paidInvoices.length;
    const pendingCount = pendingInvoices.length;
    const paidRevenue = paidInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const pendingRevenue = pendingInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const overdueCount = pendingInvoices.filter(isOverdue).length;
    const expectedRevenue = paidRevenue + pendingRevenue;

    const totalCap = trucks.reduce((s, t) => s + (Number(t.capacityTon) || 0), 0);
    const bookedAvails = availability.filter((a) => String(a.status || '').toUpperCase() === 'BOOKED');
    const usedCap = bookedAvails.reduce((s, a) => s + (Number(a.availableCapacityTon) || 0), 0);
    const remainingCap = Math.max(totalCap - usedCap, 0);
    const utilisation = totalCap > 0 ? (usedCap / totalCap) * 100 : 0;

    const buckets = monthBuckets(start, end);
    const multiYear = start.getFullYear() !== end.getFullYear();
    const labelOf = (b) => `${MONTHS[b.getMonth()]}${multiYear ? ` ${String(b.getFullYear()).slice(2)}` : ''}`;
    const tripsSeries = buckets.map((b) => ({
      label: labelOf(b),
      value: enriched.filter((e) => e.date && inBucket(e.date, b) && isIn(e.date, start, end)).length,
    }));
    const revSeries = buckets.map((b) => ({
      label: labelOf(b),
      value: paidInvoices.filter((i) => invDate(i) && inBucket(invDate(i), b)).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    }));
    const monthly = buckets.map((b) => ({
      label: labelOf(b),
      trips: tripsSeries.find((s) => s.label === labelOf(b)).value,
      revenue: revSeries.find((s) => s.label === labelOf(b)).value,
    }));

    const recentRows = [...inPeriod]
      .sort((a, b) => (a.date && b.date ? b.date.getTime() - a.date.getTime() : a.date ? -1 : 1))
      .slice(0, 10);

    return {
      start, end, inverted,
      totalTrips, tripDelta, prevCount,
      paidCount, pendingCount, overdueCount, paidRevenue, pendingRevenue, expectedRevenue,
      totalCap, usedCap, remainingCap, utilisation,
      tripsSeries, revSeries, monthly, recentRows, enriched,
      paidTotal: paidRevenue,
    };
  }, [data, range, from, to]);

  const exportCsv = () => {
    if (!model) return;
    const rows = model.recentRows;
    const quote = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Trip ID', 'Route', 'Truck', 'Shipment', 'Capacity Used (ton)', 'Trip Status', 'Revenue (LKR)', 'Payment Status', 'Date'];
    const lines = [
      ['Backhaul-Match — Fleet Report'],
      [`Period ${model.start.toLocaleDateString()} → ${model.end.toLocaleDateString()}`],
      [''],
      header.map(quote).join(','),
      ...rows.map((r) => [
        r.id,
        r.route ? r.route.replace(/\s*→\s*/g, ' / ') : '—',
        r.truckNo,
        r.shipmentId ?? '—',
        r.capacityUsed ?? '',
        r.tripStatus,
        r.revenue,
        r.paymentStatus ?? '—',
        r.dateLabel,
      ].map(quote).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backhaul-report-${new Date(exported.current.getTime()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- loading / error ---------------- */

  if (loading) {
    return (
      <Box>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" gap={1.5} sx={{ mb: 3 }}>
          <Box>
            <Skeleton width={180} height={40} />
            <Skeleton width={320} height={20} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton width={260} height={42} />
        </Stack>
        <Grid container spacing={2.5}>
          {[0, 1, 2].map((i) => (
            <Grid item key={i} xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2.5, border: '1px solid #E5EAF2' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Skeleton width={90} height={18} />
                  <Skeleton width={40} height={40} variant="rounded" />
                </Stack>
                <Skeleton width={120} height={38} sx={{ mt: 1.5 }} />
                <Skeleton width={180} height={16} sx={{ mt: 1.5 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5} sx={{ mt: 1 }}>
          {[1, 2].map((i) => (
            <Grid item key={i} xs={12} md={6}>
              <Paper sx={{ p: 2.5, border: '1px solid #E5EAF2' }}>
                <Skeleton width={160} height={20} />
                <Skeleton width="100%" height={220} sx={{ mt: 2 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error || !model) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
        {error || 'No report data available'}
      </Alert>
    );
  }

  const capacityReach = `${model.utilisation.toFixed(0)}% of total fleet capacity`;

  return (
    <Box>
      {/* ============ header: title + range filter + export ============ */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 4, height: 34, borderRadius: 2, bgcolor: '#FFB020' }} />
          <Box>
            <Typography variant="h5" sx={{ lineHeight: 1.15 }}>Reports</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Trip, capacity &amp; backhaul revenue overview
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Select
            size="small"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            startAdornment={<CalendarMonthRounded sx={{ color: '#64748B', fontSize: 18, ml: 1, mr: 0.5 }} />}
            sx={{ minWidth: 150, bgcolor: '#F0F7FD' }}
          >
            {RANGE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
          {range === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                sx={{ width: 150, bgcolor: '#F0F7FD' }}
              />
              <TextField
                size="small"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                sx={{ width: 150, bgcolor: '#F0F7FD' }}
              />
            </>
          )}
          <Button variant="contained" color="primary" startIcon={<DownloadRounded />} onClick={exportCsv}>
            Export Report
          </Button>
        </Stack>
      </Box>

      {/* ============ summary cards ============ */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Trips"
            icon={<LocalShippingIcon />}
            accent={C.blue}
            value={model.totalTrips}
            sub={model.totalTrips === 1 ? 'backhaul trip' : 'backhaul trips'}
            delta={model.tripDelta}
            rest={
              model.prevCount === 0 && model.tripDelta == null ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                  vs previous period
                </Typography>
              ) : null
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Used Capacity"
            icon={<Inventory2Rounded />}
            accent={C.indigo}
            value={model.usedCap === 0 ? '0 ton' : ton(model.usedCap)}
            sub="Currently booked"
            rest={
              <Box sx={{ mt: 1.25 }}>
                <Box sx={{ height: 8, borderRadius: 2, bgcolor: '#EEF2F7', overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.min(model.utilisation, 100)}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.indigo}, ${C.blue})`, transition: 'width .4s ease' }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', fontWeight: 600 }}>
                  {capacityReach}
                </Typography>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Backhaul Revenue"
            icon={<PaidRounded />}
            accent={C.green}
            value={money(model.paidRevenue)}
            sub={model.paidCount > 0 ? `From paid invoices · ${model.paidCount} paid` : 'No paid invoices yet'}
            rest={
              model.paidCount > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                  <ReceiptLongRounded sx={{ color: C.green, fontSize: 15 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {model.paidCount} paid invoice{model.paidCount === 1 ? '' : 's'}
                  </Typography>
                </Stack>
              ) : null
            }
          />
        </Grid>
      </Grid>

      {/* ============ pending revenue banner ============ */}
      <Paper
        sx={{
          mt: 2.5,
          p: { xs: 2.5, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFC24D 0%, #F59E0B 55%, #D97706 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
          <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309', flexShrink: 0 }}>
            <ReportProblemRounded fontSize="large" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: '0.05em', color: 'rgba(20,20,20,0.75)', fontSize: '0.78rem' }}>
              Pending Revenue
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 34, lineHeight: 1.05, color: '#081B36' }}>
              {money(model.pendingRevenue)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(8,27,54,0.8)' }}>
              {model.pendingCount > 0
                ? `${model.pendingCount} unpaid invoice${model.pendingCount === 1 ? '' : 's'}${model.overdueCount > 0 ? ` · ${model.overdueCount} overdue` : ''}`
                : 'No pending payments'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/revenue')}
          startIcon={<ReceiptLongRounded />}
          sx={{ zIndex: 1, bgcolor: '#081B36', '&:hover': { bgcolor: '#123B73' } }}
        >
          View Invoices
        </Button>
      </Paper>

      {/* ============ capacity + revenue overview ============ */}
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #E5EAF2' }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              CAPACITY
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: C.navy, mt: 0.25, mb: 2 }}>
              Capacity Utilisation
            </Typography>
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213D' }}>Fleet capacity in use</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: C.navy }}>{model.utilisation.toFixed(1)}%</Typography>
              </Box>
              <Box sx={{ height: 14, borderRadius: 2, bgcolor: '#EEF2F7', overflow: 'hidden' }}>
                <Box sx={{ width: `${Math.min(model.utilisation, 100)}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.indigo})`, transition: 'width .4s ease' }} />
              </Box>
            </Box>
            <Stack spacing={1}>
              {[
                { label: 'Used', value: ton(model.usedCap), color: C.blue },
                { label: 'Available (fleet total)', value: ton(model.totalCap), color: C.slate },
                { label: 'Remaining', value: ton(model.remainingCap), color: C.green },
              ].map((r) => (
                <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px dashed #E5EAF2' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: r.color }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{r.label}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B2447' }}>{r.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #E5EAF2' }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              REVENUE
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: C.navy, mt: 0.25, mb: 1 }}>
              Revenue Overview
            </Typography>
            {model.paidRevenue === 0 && model.pendingRevenue === 0 ? (
              <Box sx={{ mt: 0.5 }}>
                <EmptyState
                  icon={<ReceiptLongRounded />}
                  title="No invoice activity yet"
                  message="Invoices generated from accepted bookings will appear here."
                />
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Donut
                    size={168}
                    thickness={22}
                    data={[
                      { label: 'Paid', value: model.paidRevenue, color: C.green },
                      { label: 'Pending', value: model.pendingRevenue, color: C.amber },
                    ]}
                    centerTop={moneyCompact(model.expectedRevenue)}
                    centerBottom="Expected"
                    emptyLabel="No revenue yet"
                  />
                </Box>
                <SegBar
                  segs={[
                    { color: C.green, value: model.paidRevenue, total: model.expectedRevenue },
                    { color: C.amber, value: model.pendingRevenue, total: model.expectedRevenue },
                  ]}
                  height={12}
                />
                <Legend
                  items={[
                    {
                      label: `Paid · ${model.paidCount} invoice${model.paidCount === 1 ? '' : 's'}`,
                      value: money(model.paidRevenue),
                      color: C.green,
                      pct: percentage(model.paidRevenue, model.expectedRevenue).toFixed(0),
                    },
                    {
                      label: `Pending · ${model.pendingCount} unpaid`,
                      value: money(model.pendingRevenue),
                      color: C.amber,
                      pct: percentage(model.pendingRevenue, model.expectedRevenue).toFixed(0),
                    },
                  ]}
                />
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#F0F7FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213D' }}>Total Expected Revenue</Typography>
                  <Typography sx={{ fontWeight: 800, color: C.navy }}>{money(model.expectedRevenue)}</Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ============ trip performance + revenue trend ============ */}
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #E5EAF2' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                  PERFORMANCE
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: C.navy, mt: 0.25 }}>
                  Backhaul Trips
                </Typography>
              </Box>
              <Chip size="small" label={`${model.totalTrips} in period`} sx={{ bgcolor: 'rgba(37,99,235,0.10)', color: C.blue, fontWeight: 700 }} />
            </Box>
            {model.totalTrips === 0 ? (
              <EmptyState icon={<RouteRounded />} title="No backhaul trips recorded yet" message="Trips created from bookings or the trips page will appear here over time." />
            ) : (
              <VerticalBars data={model.tripsSeries} color={C.blue} formatValue={(v) => String(v)} height={250} />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2.5, height: '100%', border: '1px solid #E5EAF2' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                  REVENUE
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: C.navy, mt: 0.25 }}>
                  Revenue Trend
                </Typography>
              </Box>
              <Chip size="small" label={`${money(model.paidRevenue)} paid`} sx={{ bgcolor: 'rgba(22,163,74,0.10)', color: C.green, fontWeight: 700 }} />
            </Box>
            {model.paidRevenue === 0 ? (
              <EmptyState icon={<PaidRounded />} title="No paid invoices yet" message="Paid backhaul revenue by month will appear here." />
            ) : (
              <VerticalBars data={model.revSeries} color={C.green} formatValue={moneyCompact} height={250} />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ============ monthly breakdown ============ */}
      <Paper sx={{ mt: 2.5, p: 2.5, border: '1px solid #E5EAF2' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
            MONTHLY
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: C.navy }}>Backhaul Trips &amp; Revenue</Typography>
        </Box>
        {model.monthly.every((m) => m.trips === 0 && m.revenue === 0) ? (
          <EmptyState icon={<RouteRounded />} title="No activity in this period" message="Trip and revenue totals per month will appear here." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr>
                  {['Month', 'Backhaul Trips', 'Revenue'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', color: '#5B6B84', borderBottom: '1px solid #E5EAF2', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.monthly.map((m) => (
                  <tr key={m.label}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0B2447', borderBottom: '1px dashed #E5EAF2' }}>{m.label}</td>
                    <td style={{ padding: '10px 12px', color: '#14213D', borderBottom: '1px dashed #E5EAF2' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocalShippingIcon sx={{ color: C.blue, fontSize: 17 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.trips}</Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#14213D', borderBottom: '1px dashed #E5EAF2' }}>{m.revenue > 0 ? money(m.revenue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>

      {/* ============ recent backhaul trips ============ */}
      <Paper sx={{ mt: 2.5, p: 2.5, border: '1px solid #E5EAF2' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
          <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
            RECENT
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: C.navy }}>Recent Backhaul Trips</Typography>
        </Box>
        {model.recentRows.length === 0 ? (
          <EmptyState icon={<LocalShippingIcon />} title="No backhaul trips recorded yet" message="When trucks run backhaul trips, the most recent ones appear here." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr>
                  {['Trip', 'Route', 'Truck', 'Shipment', 'Capacity Used', 'Trip Status', 'Revenue', 'Payment', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', color: '#5B6B84', borderBottom: '1px solid #E5EAF2', fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.recentRows.map((r) => (
                  <tr key={r.id} style={{ transition: 'background .15s ease' }}>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: C.navy }}>TRIP-{String(r.id).padStart(4, '0')}</Typography>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Stack direction="row" alignItems="center" spacing={0.6}>
                        <RouteRounded sx={{ color: '#64748B', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#14213D' }}>{r.route || '—'}</Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213D' }}>{r.truckNo}</Typography>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" color="text.secondary">{r.shipmentId != null ? `SHP-${String(r.shipmentId).padStart(4, '0')}` : '—'}</Typography>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#14213D' }}>{r.capacityUsed != null ? ton(r.capacityUsed) : '—'}</Typography>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <StatusChip status={r.tripStatus} />
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: r.revenue > 0 ? C.navy : '#94A3B8' }}>{r.revenue > 0 ? money(r.revenue) : '—'}</Typography>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <PayChip status={r.paymentStatus} />
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px dashed #E5EAF2' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.dateLabel}</Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </Paper>

      <Divider sx={{ my: 2, opacity: 0 }} />
    </Box>
  );
}