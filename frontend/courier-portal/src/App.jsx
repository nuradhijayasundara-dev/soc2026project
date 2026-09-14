import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ShipmentList from './pages/ShipmentList';
import ShipmentCreate from './pages/ShipmentCreate';
import ShipmentDetails from './pages/ShipmentDetails';
import Customers from './pages/Customers';
import Tracking from './pages/Tracking';
import MatchResults from './pages/MatchResults';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import Reports from './pages/Reports';
import PlatformReports from './pages/PlatformReports';
import { isAuthenticated, LOGIN_PORTAL_URL } from './api/authApi';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* No login form here — the unified Login Portal owns authentication. */}
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<ShipmentCreate />} />
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/:id" element={<ShipmentDetails />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/matches/:requestId" element={<MatchResults />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/platform-reports" element={<PlatformReports />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated() ? '/dashboard' : LOGIN_PORTAL_URL} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}