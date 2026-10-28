import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import Auctions from '../pages/Auctions';
import CreateAuction from '../pages/CreateAuction';
import AuctionDetails from '../pages/AuctionDetails';
import MyActivity from '../pages/MyActivity';
import Notifications from '../pages/Notifications';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

/**
 * ProtectedRoute:
 * Restricts access to authenticated students only.
 * Redirects unauthenticated users to /login and preserves their intended destination.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * PublicRoute:
 * Restricts access to unauthenticated users.
 * Redirects already signed-in students to home (/).
 */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Main application routes with authentication-first flow
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Marketplace Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctions"
        element={
          <ProtectedRoute>
            <Auctions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctions/create"
        element={
          <ProtectedRoute>
            <CreateAuction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctions/:id"
        element={
          <ProtectedRoute>
            <AuctionDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <MyActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
