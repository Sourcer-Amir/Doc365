import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
