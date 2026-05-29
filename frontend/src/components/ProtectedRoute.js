import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();

  // Not logged in → redirect to login, save current path so we can redirect back
  if (!userInfo) {
    return (
      <Navigate
        to={adminOnly ? '/admin/login' : '/login'}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Logged in but not admin → back to home
  if (adminOnly && userInfo.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;