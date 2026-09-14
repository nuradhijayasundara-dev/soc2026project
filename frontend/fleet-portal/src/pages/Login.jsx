import React from 'react';
import { Navigate } from 'react-router-dom';

// No login form here — authentication happens only in the unified Login Portal
// (frontend/login-portal, http://localhost:3100). This route bounces there.
export default function Login() {
  return <Navigate to="http://localhost:3100" replace />;
}