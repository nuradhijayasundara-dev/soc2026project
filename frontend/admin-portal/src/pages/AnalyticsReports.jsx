import React, { useEffect, useState } from 'react';
import { Box, Alert, Grid, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import StatCard from '../ui/StatCard';
import StatusBarChart from '../ui/StatusBarChart';
import StatusPieChart from '../ui/StatusPieChart';

// "Analytics & Reporting" — composed entirely from figures the other admin
// endpoints already expose (platform-summary, revenue-summary, and the
// per-service /admin/stats breakdowns). No new backend endpoint was needed:
// this page just presents existing real data as charts, which is display-only
// aggregation — every number is a plain pass-through of a service's own
// computed stat, never business logic computed in the frontend.
export default function AnalyticsReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/matching/reports/platform-summary'),
      apiClient.get('/payment/admin/revenue-summary'),
      apiClient.get('/courier/admin/stats'),
      apiClient.get('/fleet/admin/stats'),
      apiClient.get('/matching/admin/stats'),
    ])
      .then(([summary, revenue, courier, fleet, matching]) => {
        setData({ summary: summary.data, revenue: revenue.data, courier: courier.data, fleet: fleet.data, matching: matching.data });
      })
      .catch(() => setError('Could not load analytics (one or more services may be down).'))
      .finally(() => setLoading(false));
  }, []);

  const revenueRows = data
    ? [
        { label: 'Paid', amount: Number(data.revenue.totalRevenue), fill: '#16A34A' },
        { label: 'Pending', amount: Number(data.revenue.pendingRevenue), fill: '#D97706' },
      ]
    : [];

  return (
    <Box>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Platform-wide figures aggregated from every microservice's own admin API."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading analytics…" />}

      {!loading && !error && data && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AssessmentIcon fontSize="small" />} accent="#0284C7"
                label="Total Matches" value={data.summary.totalMatches} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AssessmentIcon fontSize="small" />} accent="#16A34A"
                label="Successful Bookings" value={data.summary.successfulBookings} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AssessmentIcon fontSize="small" />} accent="#FFB020"
                label="Capacity Utilized" value={`${data.summary.totalCapacityUtilizedTon} ton`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AssessmentIcon fontSize="small" />} accent="#16A34A"
                label="Total Revenue" value={`LKR ${Number(data.revenue.totalRevenue).toLocaleString()}`} />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Revenue: Paid vs Pending</Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueRows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#334155' }} width={70} />
                    <Tooltip
                      formatter={(v) => `LKR ${Number(v).toLocaleString()}`}
                      contentStyle={{ borderRadius: 10, border: '1px solid #E5EAF2', fontSize: 12 }}
                    />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={36}>
                      {revenueRows.map((r) => (
                        <Cell key={r.label} fill={r.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <StatusPieChart title="Booking Outcomes" data={data.matching.resultsByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatusBarChart title="Shipments by Status" data={data.courier.shipmentsByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatusBarChart title="Trucks by Status" data={data.fleet.trucksByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatusBarChart title="Trips by Status" data={data.fleet.tripsByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatusBarChart title="Match Requests by Status" data={data.matching.requestsByStatus} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
