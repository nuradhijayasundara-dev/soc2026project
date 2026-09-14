import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import LoadingState from '../ui/LoadingState';
import CompanySetupDialog from './CompanySetupDialog';
import { getMyCompany } from '../api/companyApi';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import PersonIcon from '@mui/icons-material/Person';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PaidIcon from '@mui/icons-material/Paid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout, getRole } from '../api/authApi';
import NotificationBell from './NotificationBell';

const drawerWidth = 248;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Trucks', path: '/trucks', icon: <LocalShippingIcon /> },
  { label: 'Drivers', path: '/drivers', icon: <PersonIcon /> },
  { label: 'Trips', path: '/trips', icon: <AltRouteIcon /> },
  { label: 'Availability', path: '/availability', icon: <EventAvailableIcon /> },
  { label: 'Bookings', path: '/bookings', icon: <AssignmentTurnedInIcon /> },
  { label: 'Revenue', path: '/revenue', icon: <PaidIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { label: 'GPS Tracking', path: '/gps', icon: <GpsFixedIcon /> },
];

export default function Layout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = getRole();

  // Onboarding gate: a fleet manager must have a fleet company before trucks,
  // drivers, availability & the dashboard work — fleet-service returns 404
  // until then. Check on boot; if none exists, hold the app on the
  // company-setup dialog (non-dismissible) until the profile is saved.
  const [companyReady, setCompanyReady] = useState(null); // null = checking, true = ready, false = needs setup
  useEffect(() => {
    getMyCompany()
      .then(() => setCompanyReady(true))
      .catch((err) => setCompanyReady(err?.response?.status !== 404));
  }, []);

  const handleLogout = () => {
    logout(); // clears the session and redirects to the unified Login Portal
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFB020, #F59E0B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#081B36',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          BM
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>
            Backhaul-Match
          </Typography>
          <Typography
            sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '.10em', fontWeight: 700 }}
          >
            FLEET PORTAL
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
                primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 500 }}
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
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} title="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#14213D' }}>
            Fleet Portal
          </Typography>
          <Box sx={{ flex: 1 }} />
          <NotificationBell />
          <Chip
            label={role || 'FLEET'}
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

      <Box component="main" sx={{ flexGrow: 1, width: 0, mt: 8, p: { xs: 2, md: 3 } }}>
        {companyReady === null && <LoadingState label="Checking your company profile…" />}
        {companyReady === false && (
          <CompanySetupDialog
            open
            onClose={() => {}}
            onSaved={() => setCompanyReady(true)}
          />
        )}
        {companyReady === true && <Outlet />}
      </Box>
    </Box>
  );
}