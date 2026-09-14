import React from 'react';
import { Navigate } from 'react-router-dom';
import { adoptSessionFromCookie, isAuthenticated, getRole, LOGIN_PORTAL_URL } from '../api/authApi';

// Frontend guard (defense in depth). The authoritative checks live at the API
// Gateway (JwtAuthFilter allowedRoles) and inside microservices.
export default function ProtectedRoute({ children }) {
  adoptSessionFromCookie();

  if (!isAuthenticated()) {
    return <Navigate to={LOGIN_PORTAL_URL} replace />;
  }

  const role = getRole();
  if (role && role !== 'COURIER_USER' && role !== 'ADMIN') {
    return <Navigate to={LOGIN_PORTAL_URL} replace />;
  }

  return children;
}