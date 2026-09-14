import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box, Button, Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getMyNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../api/notificationApi';

const POLL_INTERVAL_MS = 15000;

// Where clicking a notification should take you, based on its type.
const linkFor = (n) => {
  switch (n.type) {
    case 'MATCH_FOUND': return `/matches/${n.referenceId}`;
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_REJECTED':
    case 'SHIPMENT_STATUS': return `/shipments/${n.referenceId}`;
    default: return null;
  }
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    getMyNotifications().then(setNotifications).catch(() => {});
  };

  const handleClose = () => setAnchorEl(null);

  const handleClickNotification = async (n) => {
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {});
      refresh();
    }
    handleClose();
    const link = linkFor(n);
    if (link) navigate(link);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAllNotificationsRead().catch(() => {});
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
        PaperProps={{ sx: { width: 360, maxHeight: 420 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>No notifications yet</MenuItem>
        ) : notifications.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => handleClickNotification(n)}
            sx={{ whiteSpace: 'normal', bgcolor: n.read ? 'transparent' : 'action.hover' }}
          >
            <Box>
              <Typography variant="body2" fontWeight={n.read ? 400 : 700}>{n.title}</Typography>
              <Typography variant="caption" color="text.secondary">{n.message}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
