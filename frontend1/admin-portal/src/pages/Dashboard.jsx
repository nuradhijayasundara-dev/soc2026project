import React, { useEffect, useState } from 'react';
import { Grid, Box, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BadgeIcon from '@mui/icons-material/Badge';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import StraightenIcon from '@mui/icons-material/Straighten';
import PaymentsIcon from '@mui/icons-material/Payments';
import DnsIcon from '@mui/icons-material/Dns';
import apiClient from '../apiClient';
import StatCard from '../ui/StatCard';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import StatusPieChart from '../ui/StatusPieChart';
import StatusBarChart from '../ui/StatusBarChart';

// The Admin Dashboard's 13 stat categories. Every figure below comes from a
// real admin endpoint added for this portal (see the *AdminController classes
// added to each microservice) — nothing here is hardcoded or simulated.
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // /users/me 404s for accounts that haven't created a profile yet — that's
    // auxiliary "Signed in as" info, so don't let it blank the whole dashboard.
    apiClient.get('/users/me').then((u) => setMe(u.data)).catch(() => setMe(null));
    Promise.all([
      apiClient.get('/matching/reports/platform-summary'),
      apiClient.get('/auth/admin/users'),
      apiClient.get('/courier/admin/stats'),
      apiClient.get('/fleet/admin/stats'),
      apiClient.get('/matching/admin/stats'),
      apiClient.get('/payment/admin/revenue-summary'),
      apiClient.get('/system/services'),
    ])
      .then(([summary, users, courier, fleet, matching, revenue, system]) => {
        setData({
          summary: summary.data,
          totalUsers: users.data.length,
          courier: courier.data,
          fleet: fleet.data,
          matching: matching.data,
          revenue: revenue.data,
          system: system.data,
        });
      })
      .catch((err) => {
        setError(err.response?.status === 403
          ? 'This area is restricted to ADMIN accounts.'
          : `Could not load dashboard (${err.response?.status || 'network error'}).`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;

  return (
    <Box>
      <PageHeader
        title="Platform Overview"
        subtitle="Live, platform-wide figures pulled from every microservice through the API Gateway."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {!error && data && (
        <>
          {me && (
            <Alert severity="success" icon={false} sx={{ mb: 2.5 }}>
              Signed in as <strong>{me.fullName || me.username || me.userId}</strong>
              {me.email ? ` (${me.email})` : ''}
            </Alert>
          )}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<PeopleIcon fontSize="small" />} accent="#0284C7"
                label="Total Users" value={data.totalUsers} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<BusinessIcon fontSize="small" />} accent="#7C3AED"
                label="Courier Companies" value={data.courier.totalCompanies} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<ApartmentIcon fontSize="small" />} accent="#7C3AED"
                label="Fleet Companies" value={data.fleet.totalCompanies} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<Inventory2Icon fontSize="small" />} accent="#0D9488"
                label="Total Shipments" value={data.courier.totalShipments} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<LocalShippingIcon fontSize="small" />} accent="#FFB020"
                label="Total Trucks" value={data.fleet.totalTrucks} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<BadgeIcon fontSize="small" />} accent="#FFB020"
                label="Total Drivers" value={data.fleet.totalDrivers} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<SwapHorizIcon fontSize="small" />} accent="#0284C7"
                label="Total Matches" value={data.summary.totalMatches} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<CheckCircleIcon fontSize="small" />} accent="#16A34A"
                label="Successful Bookings" value={data.summary.successfulBookings} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<HourglassEmptyIcon fontSize="small" />} accent="#EA580C"
                label="Pending Bookings" value={data.matching.resultsByStatus?.PENDING_CONFIRMATION ?? 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<AltRouteIcon fontSize="small" />} accent="#2563EB"
                label="Active Trips" value={data.fleet.tripsByStatus?.IN_PROGRESS ?? 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<StraightenIcon fontSize="small" />} accent="#16A34A"
                label="Capacity Utilized" value={`${data.summary.totalCapacityUtilizedTon} ton`} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<PaymentsIcon fontSize="small" />} accent="#16A34A"
                label="Total Revenue" value={`LKR ${Number(data.revenue.totalRevenue).toLocaleString()}`} />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard icon={<DnsIcon fontSize="small" />} accent={data.system.services.every((s) => s.status === 'UP') ? '#16A34A' : '#DC2626'}
                label="Services Online" value={`${data.system.services.filter((s) => s.status === 'UP').length}/${data.system.totalServices}`} />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatusPieChart title="Shipments by Status" data={data.courier.shipmentsByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatusBarChart title="Trucks by Status" data={data.fleet.trucksByStatus} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatusBarChart title="Bookings by Status" data={data.matching.resultsByStatus} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
