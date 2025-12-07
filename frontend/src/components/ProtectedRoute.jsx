import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Render a loading indicator while checking auth status
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // login, which is a nicer user experience.
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
