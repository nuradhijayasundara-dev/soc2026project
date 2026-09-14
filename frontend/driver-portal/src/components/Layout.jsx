import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../session';

const drawerWidth = 248;

const NAV_ITEMS = [
  { label: 'My Trips', path: '/trips', icon: <AltRouteIcon /> },
  { label: 'Send Location', path: '/location', icon: <GpsFixedIcon /> },
];

export default function Layout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => logout(); // redirects to the unified Login Portal

  const drawer = (
    <Box>
      <Box
        sx={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            BM
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Backhaul-Match
            </Typography>
            <Typography
              sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.10em', fontWeight: 700 }}
            >
              DRIVER PORTAL
            </Typography>
          </Box>
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
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} title="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography noWrap sx={{ fontWeight: 700, color: '#14213D', fontSize: '1.05rem' }}>
            Driver Portal
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mr: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}
          >
            (web companion — use the Driver mobile app)
          </Typography>
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
        <Outlet />
      </Box>
    </Box>
  );
}