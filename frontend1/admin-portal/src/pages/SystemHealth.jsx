import React, { useEffect, useState } from 'react';
import { Box, Alert, Grid, Paper, Typography, Chip } from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DnsIcon from '@mui/icons-material/Dns';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';

const REFRESH_INTERVAL_MS = 15000;

// "System Monitoring" — reads GET /api/system/services, a local api-gateway
// endpoint backed by its own Eureka DiscoveryClient view (see
// api-gateway's SystemController). No business logic lives here: this page
// only renders what the gateway reports.
export default function SystemHealth() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    apiClient.get('/system/services')
      .then((r) => { setServices(r.data.services); setError(''); })
      .catch(() => setError('Could not load system health (is the API Gateway reachable?).'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <PageHeader
        title="System Health"
        subtitle="Which backend services are registered with Eureka and how many instances of each are up."
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading service registry…" />}

      {!loading && !error && services.length === 0 && (
        <EmptyState
          icon={<DnsIcon fontSize="inherit" />}
          title="No services registered"
          message="Nothing has registered with Eureka yet — is discovery-server running?"
        />
      )}

      {!loading && !error && services.length > 0 && (
        <Grid container spacing={2.5}>
          {services.map((svc) => (
            <Grid item xs={12} sm={6} md={4} key={svc.serviceId}>
              <Paper sx={{ p: 2.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonitorHeartIcon fontSize="small" sx={{ color: svc.status === 'UP' ? '#16A34A' : '#DC2626' }} />
                    <Typography sx={{ fontWeight: 700 }}>{svc.serviceId}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={svc.status}
                    sx={{
                      backgroundColor: svc.status === 'UP' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
                      color: svc.status === 'UP' ? '#16A34A' : '#DC2626',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {svc.instanceCount} instance{svc.instanceCount === 1 ? '' : 's'}
                </Typography>
                {svc.instances.map((inst) => (
                  <Typography key={inst.instanceId} variant="caption" color="text.secondary" component="div">
                    {inst.host}:{inst.port}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
