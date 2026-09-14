import React, { useEffect, useState } from 'react';
import { Box, Alert, Paper, TextField, Button, Grid, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import apiClient from '../apiClient';
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import DataTable from '../ui/DataTable';

// "Notification Management" — reads notification-service's platform-wide
// feed (GET /api/notifications/admin/all) and lets an admin send a direct
// message to one user (POST /api/notifications/admin/send). Both endpoints
// stay inside notification-service; delivery (in-app + best-effort email)
// is still decided by NotificationService, not by this page.
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/notifications/admin/all')
      .then((r) => setNotifications(r.data))
      .catch(() => setError('Could not load notifications (is notification-service running?).'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const send = async (e) => {
    e.preventDefault();
    if (!userId || !title || !message) return;
    setSending(true);
    setSendResult('');
    try {
      await apiClient.post('/notifications/admin/send', { userId: Number(userId), title, message });
      setSendResult('success');
      setTitle('');
      setMessage('');
      load();
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'type', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' },
    { key: 'read', label: 'Read', render: (n) => (n.read ? 'Yes' : 'No') },
    { key: 'createdAt', label: 'Sent', render: (n) => (n.createdAt ? new Date(n.createdAt).toLocaleString() : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Notification Management"
        subtitle="Recent notifications sent across the platform, and a direct admin message to one user."
      />

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Send a message
        </Typography>
        <Box component="form" onSubmit={send}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="User ID"
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={9}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                required
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SendIcon />}
            disabled={sending}
            sx={{ mt: 1.5 }}
          >
            {sending ? 'Sending…' : 'Send Message'}
          </Button>
          {sendResult === 'success' && <Alert severity="success" sx={{ mt: 1.5 }}>Message sent.</Alert>}
          {sendResult === 'error' && <Alert severity="error" sx={{ mt: 1.5 }}>Could not send that message — check the user ID.</Alert>}
        </Box>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LoadingState label="Loading notifications…" />}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          icon={<NotificationsIcon fontSize="inherit" />}
          title="No notifications yet"
          message="Notifications appear here as the platform generates them (matches, bookings, shipment status, admin messages)."
        />
      )}
      {!loading && !error && notifications.length > 0 && (
        <DataTable columns={columns} rows={notifications} />
      )}
    </Box>
  );
}
