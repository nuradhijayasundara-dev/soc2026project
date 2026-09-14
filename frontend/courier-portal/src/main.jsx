import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import App from './App';
import { adoptSessionFromCookie } from './api/authApi';

// Adopt the Login Portal's session BEFORE the router renders — otherwise a
// first-paint route guard can send us back to the Login Portal prematurely.
adoptSessionFromCookie();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);