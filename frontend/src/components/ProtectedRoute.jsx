import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  // Admin routes → cho phép tất cả nhân viên nội bộ (admin, staff, kitchen, shipper)
  if (adminOnly) {
    if (!user) return <Navigate to="/admin/login" replace />;
    if (!isStaff) return <Navigate to="/" replace />;
    return children;
  }

  // User routes (checkout, order tracking) → redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
