import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import FleetDashboard from './pages/FleetDashboard';
import TruckList from './pages/TruckList';
import TruckDetails from './pages/TruckDetails';
import DriverAssignment from './pages/DriverAssignment';
import TripCreate from './pages/TripCreate';
import Drivers from './pages/Drivers';
import GpsTracking from './pages/GpsTracking';
import Availability from './pages/Availability';
import BookingRequests from './pages/BookingRequests';
import RevenueDashboard from './pages/RevenueDashboard';
import Reports from './pages/Reports';
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
          <Route path="/dashboard" element={<FleetDashboard />} />
          <Route path="/trucks" element={<TruckList />} />
          <Route path="/trucks/:id" element={<TruckDetails />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/trips" element={<DriverAssignment />} />
          <Route path="/trips/new" element={<TripCreate />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/bookings" element={<BookingRequests />} />
          <Route path="/revenue" element={<RevenueDashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/gps" element={<GpsTracking />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated() ? '/dashboard' : LOGIN_PORTAL_URL} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
