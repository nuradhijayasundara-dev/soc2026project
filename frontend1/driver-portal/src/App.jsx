import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import MyTrips from './pages/MyTrips';
import SendLocation from './pages/SendLocation';
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
          <Route path="/trips" element={<MyTrips />} />
          <Route path="/location" element={<SendLocation />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated() ? '/trips' : LOGIN_PORTAL_URL} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}