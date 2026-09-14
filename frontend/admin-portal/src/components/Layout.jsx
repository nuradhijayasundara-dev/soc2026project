import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BadgeIcon from '@mui/icons-material/Badge';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MapIcon from '@mui/icons-material/Map';
import PaymentsIcon from '@mui/icons-material/Payments';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout, getRole } from '../session';
import Logo from '../ui/Logo';

const drawerWidth = 248;

// Exact nav order from the Admin Management System spec.
const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="medium" /> },
  { label: 'Users', path: '/users', icon: <PeopleIcon fontSize="medium" /> },
  { label: 'Courier Companies', path: '/courier-companies', icon: <BusinessIcon fontSize="medium" /> },
  { label: 'Fleet Companies', path: '/fleet-companies', icon: <ApartmentIcon fontSize="medium" /> },
  { label: 'Trucks', path: '/trucks', icon: <LocalShippingIcon fontSize="medium" /> },
  { label: 'Drivers', path: '/drivers', icon: <BadgeIcon fontSize="medium" /> },
  { label: 'Shipments', path: '/shipments', icon: <Inventory2Icon fontSize="medium" /> },
  { label: 'Matching', path: '/matching', icon: <SwapHorizIcon fontSize="medium" /> },
  { label: 'Bookings', path: '/bookings', icon: <AssignmentTurnedInIcon fontSize="medium" /> },
  { label: 'Live Tracking', path: '/live-tracking', icon: <MapIcon fontSize="medium" /> },
  { label: 'Payments', path: '/payments', icon: <PaymentsIcon fontSize="medium" /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon fontSize="medium" /> },
  { label: 'Analytics & Reports', path: '/analytics', icon: <AssessmentIcon fontSize="medium" /> },
  { label: 'System Health', path: '/system-health', icon: <MonitorHeartIcon fontSize="medium" /> },
];

export default function Layout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = getRole();

  const handleLogout = () => logout(); // redirects to the unified Login Portal

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Logo />
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>
            Backhaul-Match
          </Typography>
          <Typography
            sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '.10em', fontWeight: 700 }}
          >
            ADMIN PORTAL
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {NAV_ITEMS.map((item) => {
          const selected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={selected}
              onClick={() => isMobile && setDrawerOpen(false)}
              sx={{
                color: selected ? '#fff' : 'rgba(255,255,255,0.62)',
                bgcolor: selected ? 'rgba(255,176,32,0.14)' : 'transparent',
                borderLeft: selected ? '3px solid #FFB020' : '3px solid transparent',
                pl: 1.75,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#fff' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: selected ? 700 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1, minHeight: 64 }}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Logo size={30} radius={8} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#14213D' }}>
              Admin Portal
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={role === 'ADMIN' ? 'PLATFORM ADMIN' : (role || 'guest')}
            size="small"
            sx={{
              bgcolor: 'rgba(255,176,32,0.16)',
              color: '#B45309',
              fontWeight: 700,
              letterSpacing: '.04em',
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
          <IconButton color="inherit" onClick={handleLogout} title="Logout" sx={{ color: '#5B6B84' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #0B2447 0%, #0F2E5C 100%)',
            color: '#fff',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, mt: 8, p: { xs: 2, md: 3 }, width: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}