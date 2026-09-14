import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'leaflet/dist/leaflet.css';
import theme from './theme';
import App from './App.jsx';
import { adoptSessionFromCookie } from './api/authApi';

// Adopt the Login Portal's session BEFORE the router renders — otherwise a
// first-paint route guard can send us back to the Login Portal prematurely.
adoptSessionFromCookie();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);