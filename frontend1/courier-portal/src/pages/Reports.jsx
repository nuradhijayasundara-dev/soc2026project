import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Grid, MenuItem, Paper, Select,
  Skeleton, Stack, Typography,
} from '@mui/material';
import {
  AltRouteRounded, CheckCircleOutline, DownloadRounded, Inventory2Rounded,
  SavingsRounded, TrendingDown, TrendingUp,
} from '@mui/icons-material';
import { getCourierReportSummary } from '../api/reportsApi';
import { getShipments } from '../api/shipmentApi';
import EmptyState from '../ui/EmptyState';
import Donut from '../ui/charts/Donut';
import LineArea from '../ui/charts/LineArea';
import VerticalBars from '../ui/charts/VerticalBars';

/* ------------------------------------------------------------------ */
/*  Palette + helpers                                                   */
/* ------------------------------------------------------------------ */
const C = {
  navy: '#0B2447',
  blue: '#2563EB',
  sky: '#0284C7',
  green: '#16A34A',
  indigo: '#8B5CF6',
  amber: '#F59E0B',
  slate: '#64748B',
  rose: '#F43F5E',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtInt = new Intl.NumberFormat('en-US');

const lkr = (n) => `LKR ${fmtInt.format(Math.round(Number(n) || 0))}`;
const compact = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return fmtInt.format(Math.round(v));
};
const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

const parseDate = (v) => {
  if (v == null) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const shortMonth = (key) => {
  const m = Number(key.split('-')[1]);
  return MONTHS[(m - 1 + 12) % 12];
};
const monthsBack = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const RANGE_OPTIONS = [
  { v: '1', label: 'Last month' },
  { v: '3', label: 'Last 3 months' },
  { v: '6', label: 'Last 6 months' },
  { v: '12', label: 'Last 12 months' },
  { v: 'all', label: 'All time' },
];

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */
const TrendChip = ({ delta }) => {
  if (delta == null) {
    return <Typography variant="caption" color="text.secondary">—</Typography>;
  }
  const up = delta >= 0;
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

const ReportCard = ({
  title, icon, value, sub, accent = C.blue, delta, onClick, featured = false,
  valueFont = 36,
}) => {
  const card = (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: featured ? 'none' : '1px solid #E5EAF2',
        background: featured
          ? 'linear-gradient(135deg, #FFC24D 0%, #F59E0B 55%, #D97706 100%)'
          : '#FDFEFF',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': onClick && {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 26px rgba(11,36,71,0.14)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.05em' }}
          color={featured ? 'rgba(20,20,20,0.75)' : 'text.secondary'}
        >
          {title}
        </Typography>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '11px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: featured
              ? 'rgba(255,255,255,0.92)'
              : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: featured ? '#0B2447' : '#fff',
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography
        sx={{
          fontWeight: 800, fontSize: valueFont, lineHeight: 1.05, letterSpacing: '-0.01em',
          color: featured ? '#081B36' : '#0B2447',
        }}
      >
        {value}
      </Typography>

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {delta != null && <TrendChip delta={delta} />}
        <Typography variant="caption" color={featured ? 'rgba(8,27,54,0.78)' : 'text.secondary'} sx={{ fontWeight: 600 }}>
          {sub}
        </Typography>
      </Box>

      {featured && (
        <Box
          sx={{
            position: 'absolute', right: -18, top: -18, width: 110, height: 110,
            borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </Paper>
  );
  return card;
};

const SectionCard = ({ title, subtitle, children, headerRight }) => (
  <Paper sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #E5EAF2' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
          {String(title).toUpperCase()}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: C.navy, mt: 0.25 }}>{subtitle}</Typography>
      </Box>
      {headerRight}
    </Box>
    {children}
  </Paper>
);

const Legend = ({ items }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1, mt: 2 }}>
    {items.map((it) => (
      <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 11, height: 11, borderRadius: '3px', bgcolor: it.color, flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{it.label}</Typography>
        <Typography variant="caption" fontWeight={800} sx={{ color: '#14213D' }}>{fmtInt.format(it.value)}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ width: 44, textAlign: 'right' }}>{pct(it.pct)}</Typography>
      </Box>
    ))}
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Reports() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [range, setRange] = useState('6');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([getCourierReportSummary(), getShipments()])
      .then(([s, ships]) => {
        setSummary(s);
        setShipments(Array.isArray(ships) ? ships : []);
      })
      .catch(() => setError('Could not load reports (is courier-service running?)'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const rangeLabel = RANGE_OPTIONS.find((r) => r.v === range)?.label || 'All time';

  const view = useMemo(() => {
    const n = range === 'all' ? null : Number(range);

    // Deterministic filter window for the current range + the previous one.
    const cutoff = n == null ? null : monthsBack(n);
    const prevCutoff = n == null ? null : monthsBack(2 * n);

    const inWindow = (s, from, to) => {
      const d = parseDate(s.createdAt);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d >= to) return false;
      return true;
    };

    const filtered = (cutoff == null ? shipments : shipments.filter((s) => inWindow(s, cutoff, null)));
    const prevFiltered = (prevCutoff == null ? [] : shipments.filter((s) => inWindow(s, prevCutoff, cutoff)));
    const all = shipments;

    const count = (list, status) => list.filter((s) => s.status === status).length;
    const total = filtered.length;
    const delivered = count(filtered, 'DELIVERED');
    const inTransit = count(filtered, 'IN_TRANSIT');
    const cancelled = count(filtered, 'CANCELLED');
    const pendingCreated = filtered.filter((s) => s.status === 'PENDING' || s.status === 'MATCHED').length;

    const pctChange = (cur, prev) => (prev > 0 ? (((cur - prev) / prev) * 100) : null);

    // --- monthly keys -------------------------------------------------
    const lastMonths = (howMany) => {
      const keys = [];
      const d = new Date();
      d.setDate(1); d.setHours(0, 0, 0, 0);
      for (let i = 0; i < howMany; i += 1) {
        keys.unshift(monthKey(d));
        d.setMonth(d.getMonth() - 1);
      }
      return keys;
    };

    let keys;
    if (n == null) {
      const dated = all.map((s) => parseDate(s.createdAt)).filter(Boolean);
      if (dated.length === 0) keys = [];
      else {
        const y0 = dated.reduce((m, d) => Math.min(m, d.getFullYear() * 12 + d.getMonth()), Infinity);
        const y1 = new Date();
        const span = y1.getFullYear() * 12 + y1.getMonth() - y0 + 1;
        keys = lastMonths(Math.min(span, 24));
      }
    } else {
      keys = lastMonths(n);
    }

    const volumeByKey = {};
    const savingsByKey = {};
    all.forEach((s) => {
      const d = parseDate(s.createdAt);
      if (!d) return;
      const k = monthKey(d);
      volumeByKey[k] = (volumeByKey[k] || 0) + 1;
      if (s.status === 'DELIVERED') {
        savingsByKey[k] = ((savingsByKey[k] || 0) + (Number(s.estimatedCost) || 0));
      }
    });

    const volumeSeries = keys.map((k) => ({ label: shortMonth(k), value: volumeByKey[k] || 0 }));
    const savingsSeries = keys.map((k) => ({ label: shortMonth(k), value: Math.round(savingsByKey[k] || 0) }));

    // --- top routes (on the filtered window) -------------------------
    const routeMap = {};
    filtered.forEach((s) => {
      const from = String(s.pickupLocation || '').trim();
      const to = String(s.destination || '').trim();
      if (!from || !to) return;
      const key = `${from} → ${to}`;
      if (!routeMap[key]) routeMap[key] = { route: key, count: 0, km: 0, savings: 0 };
      routeMap[key].count += 1;
      routeMap[key].km += Number(s.distanceKm) || 0;
      if (s.status === 'DELIVERED') routeMap[key].savings += Number(s.estimatedCost) || 0;
    });
    const topRoutes = Object.values(routeMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total, delivered, inTransit, cancelled, pendingCreated,
      totalDelta: pctChange(total, prevFiltered.length),
      deliveredDelta: pctChange(delivered, count(prevFiltered, 'DELIVERED')),
      deliveredPct: total ? (delivered / total) * 100 : 0,
      matchPct: all.length ? ((summary?.successfulMatches || 0) / all.length) * 100 : 0,
      volumeSeries, savingsSeries, topRoutes,
      summaryTotal: summary?.successfulMatches || 0,
    };
  }, [shipments, summary, range]);

  /* ------------------------------------------------------------------ */
  /*  Export to CSV                                                      */
  /* ------------------------------------------------------------------ */
  const exportCsv = () => {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Backhaul-Match Courier Report', ''],
      ['Generated', new Date().toISOString()],
      ['Period', rangeLabel],
      ['', ''],
      ['Overview', ''],
      ['Total shipments', view.total],
      ['Delivered', view.delivered],
      ['In transit', view.inTransit],
      ['Cancelled', view.cancelled],
      ['Created / pending', view.pendingCreated],
      ['Successful backhaul matches', view.summaryTotal],
      ['Cost savings (LKR)', Math.round(Number(summary?.costSavings) || 0)],
      ['', ''],
      ['Shipment performance by status', ''],
      ['Status', 'Count'],
      ['Delivered', view.delivered],
      ['In transit', view.inTransit],
      ['Cancelled', view.cancelled],
      ['Created / pending', view.pendingCreated],
      ['', ''],
      ['Monthly shipment volume', ''],
      ['Month', 'Count'],
      ...view.volumeSeries.map((m) => [m.label, m.value]),
      ['', ''],
      ['Cost savings over time (LKR)', ''],
      ['Month', 'Estimated savings'],
      ...view.savingsSeries.map((m) => [m.label, m.value]),
      ['', ''],
      ['Top backhaul routes', ''],
      ['Route', 'Shipments', 'Distance (km)', 'Est. savings (LKR)'],
      ...view.topRoutes.map((r) => [r.route, r.count, r.km.toFixed(1), Math.round(r.savings)]),
    ];
    const csv = rows.map((r) => r.map(q).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backhaul-match-report-${rangeLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ------------------------------------------------------------------ */
  /*  Loading / error UI                                                 */
  /* ------------------------------------------------------------------ */
  const cardSkeleton = (
    <Paper sx={{ p: 3, border: '1px solid #E5EAF2' }}>
      <Skeleton width="45%" height={18} />
      <Skeleton width="62%" height={46} sx={{ mt: 1.5 }} />
      <Skeleton width="70%" height={16} sx={{ mt: 1.5 }} />
    </Paper>
  );

  if (loading) {
    return (
      <Box>
        <Skeleton width={220} height={34} sx={{ mb: 1 }} />
        <Skeleton width={300} height={16} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>{cardSkeleton}</Grid>
          ))}
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={load}>Retry</Button>
      </Box>
    );
  }

  const costSavings = Math.round(Number(summary?.costSavings) || 0);
  const successfulMatches = view.summaryTotal;

  /* ------------------------------------------------------------------ */
  /*  Chart data                                                         */
  /* ------------------------------------------------------------------ */
  const performanceDonut = [
    { label: 'Delivered', value: view.delivered, color: C.green },
    { label: 'In Transit', value: view.inTransit, color: C.sky },
    { label: 'Created / Pending', value: view.pendingCreated, color: C.blue },
    { label: 'Cancelled', value: view.cancelled, color: C.slate },
  ];
  const performanceLegend = performanceDonut.map((d) => ({
    ...d, pct: view.total ? (d.value / view.total) * 100 : 0,
  }));

  const matchingDonut = [
    { label: 'Successful Matches', value: view.delivered + view.inTransit, color: C.indigo },
    { label: 'Pending Matches', value: view.pendingCreated, color: '#A78BFA' },
    { label: 'No Match / Cancelled', value: view.cancelled, color: C.slate },
  ];
  const matchingTotal = matchingDonut.reduce((s, d) => s + d.value, 0);
  const successInPeriod = view.delivered + view.inTransit;
  const matchingLegend = matchingDonut.map((d) => ({
    ...d, pct: matchingTotal ? (d.value / matchingTotal) * 100 : 0,
  }));

  const maxRouteCount = Math.max(1, ...view.topRoutes.map((r) => r.count));
  const noDelivered = view.savingsSeries.every((m) => m.value === 0);

  /* ------------------------------------------------------------------ */
  /*  Header                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 4, height: 40, borderRadius: 2, bgcolor: '#FFB020' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: C.navy, lineHeight: 1.1 }}>Reports</Typography>
            <Typography variant="body2" color="text.secondary">Shipment &amp; Backhaul Performance Overview</Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Select
            size="small"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            sx={{ minWidth: 150, borderRadius: 2, bgcolor: '#fff' }}
          >
            {RANGE_OPTIONS.map((r) => (
              <MenuItem key={r.v} value={r.v}>{r.label}</MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadRounded />}
            onClick={exportCsv}
            sx={{ borderRadius: 2 }}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* ================= Summary cards ================= */}
      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ReportCard
            title="TOTAL SHIPMENTS"
            icon={<Inventory2Rounded />}
            accent={C.blue}
            value={fmtInt.format(view.total)}
            sub={view.total === 0 ? 'No shipments yet in this period' : 'All shipments'}
            delta={view.totalDelta}
            onClick={() => navigate('/shipments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ReportCard
            title="DELIVERED"
            icon={<CheckCircleOutline />}
            accent={C.green}
            value={fmtInt.format(view.delivered)}
            sub={view.total ? `${pct(view.deliveredPct)} of shipments delivered` : 'No deliveries yet'}
            delta={view.deliveredDelta}
            onClick={() => navigate('/tracking')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ReportCard
            title="SUCCESSFUL MATCHES"
            icon={<AltRouteRounded />}
            accent={C.indigo}
            value={fmtInt.format(successfulMatches)}
            sub={
              successfulMatches === 0
                ? 'No completed matches yet'
                : `${pct(view.matchPct)} of shipments matched`
            }
            delta={null}
            onClick={() => navigate('/requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <ReportCard
            featured
            title="COST SAVINGS"
            icon={<SavingsRounded />}
            value={lkr(costSavings)}
            valueFont={30}
            sub={
              costSavings === 0
                ? 'No completed matches yet — savings will appear after completed backhaul bookings.'
                : 'vs. dedicated forward-haul (estimated)'
            }
            delta={null}
            onClick={() => navigate('/invoices')}
          />
        </Grid>
      </Grid>

      {/* ================= Performance donuts ================= */}
      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Status" subtitle="Shipment Performance">
            {view.total === 0 ? (
              <EmptyState
                icon={<Inventory2Rounded />}
                title="No shipments in this period"
                message="Shipments you create will be broken down by status here."
              />
            ) : (
              <>
                <Donut data={performanceDonut} centerTop={fmtInt.format(view.total)} centerBottom="Shipments" />
                <Legend items={performanceLegend} />
              </>
            )}
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard title="Outcomes" subtitle="Backhaul Matching Performance">
            {matchingTotal === 0 ? (
              <EmptyState
                icon={<AltRouteRounded />}
                title="No match activity yet"
                message="Request a backhaul match from a shipment to populate this chart."
              />
            ) : (
              <>
                <Donut data={matchingDonut} centerTop={fmtInt.format(successInPeriod)} centerBottom="In period" />
                <Legend items={matchingLegend} />
              </>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ================= Savings over time ================= */}
      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid item xs={12}>
          <SectionCard
            title="Trend"
            subtitle="Cost Savings Over Time"
            headerRight={<Chip size="small" label="LKR · estimated" sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#92400E', fontWeight: 700 }} />}
          >
            {noDelivered ? (
              <EmptyState
                icon={<SavingsRounded />}
                title="No savings to plot yet"
                message="Savings accrue on completed backhaul deliveries — this line will fill in as trips finish."
              />
            ) : (
              <LineArea
                series={view.savingsSeries}
                color={C.amber}
                formatValue={(v) => `LKR ${compact(v)}`}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ================= Volume + Top routes ================= */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Volume" subtitle="Shipment Volume">
            {view.total === 0 ? (
              <EmptyState
                icon={<Inventory2Rounded />}
                title="No volume in this period"
                message="Monthly shipment volume will appear here once shipments are created."
              />
            ) : (
              <VerticalBars data={view.volumeSeries} color={C.blue} />
            )}
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Routes" subtitle="Top Backhaul Routes">
            {view.topRoutes.length === 0 ? (
              <EmptyState
                icon={<AltRouteRounded />}
                title="No routes yet"
                message="Popular pickup → destination routes will rank here."
              />
            ) : (
              <Stack spacing={1.5}>
                {view.topRoutes.map((r) => (
                  <Box key={r.route}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#14213D' }}>
                        {r.route}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {r.count} {r.count === 1 ? 'shipment' : 'shipments'} · {r.km.toFixed(1)} km
                      </Typography>
                    </Box>
                    <Box sx={{ height: 8, borderRadius: 2, bgcolor: '#EEF2F7', overflow: 'hidden' }}>
                      <Box sx={{ width: `${(r.count / maxRouteCount) * 100}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.indigo})` }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.4, display: 'block' }}>
                      Est. savings {lkr(r.savings)} on delivered trips
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>


    </Box>
  );
}
