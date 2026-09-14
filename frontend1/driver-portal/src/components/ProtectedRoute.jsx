import React from 'react';
import { Navigate } from 'react-router-dom';
import { adoptSessionFromCookie, isAuthenticated, getRole, LOGIN_PORTAL_URL } from '../session';

// Frontend guard (defense in depth). The authoritative role checks live at the
// API Gateway (JwtAuthFilter allowedRoles) and inside the microservices.
export default function ProtectedRoute({ children }) {
  adoptSessionFromCookie();

  if (!isAuthenticated()) {
    return <Navigate to={LOGIN_PORTAL_URL} replace />;
  }

  const role = getRole();
  if (role && role !== 'DRIVER' && role !== 'ADMIN') {
    return <Navigate to={LOGIN_PORTAL_URL} replace />;
  }

  return children;
}