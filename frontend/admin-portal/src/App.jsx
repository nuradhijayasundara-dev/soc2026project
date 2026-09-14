import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import CourierCompanies from './pages/CourierCompanies';
import FleetCompanies from './pages/FleetCompanies';
import Trucks from './pages/Trucks';
import Drivers from './pages/Drivers';
import Shipments from './pages/Shipments';
import Matching from './pages/Matching';
import Bookings from './pages/Bookings';
import LiveTracking from './pages/LiveTracking';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import AnalyticsReports from './pages/AnalyticsReports';
import SystemHealth from './pages/SystemHealth';
import { isAuthenticated, LOGIN_PORTAL_URL } from './session';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/courier-companies" element={<CourierCompanies />} />
          <Route path="/fleet-companies" element={<FleetCompanies />} />
          <Route path="/trucks" element={<Trucks />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/live-tracking" element={<LiveTracking />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/analytics" element={<AnalyticsReports />} />
          <Route path="/system-health" element={<SystemHealth />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated() ? '/dashboard' : LOGIN_PORTAL_URL} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
