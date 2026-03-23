import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import BuyTicketPage from './pages/BuyTicketPage';
import ViewTicketPage from './pages/ViewTicketPage';

// Layout wrapper that includes Navbar
const WithNavbar = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

// Auth redirect
const AuthRedirect = () => {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/seller'} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<WithNavbar><HomePage /></WithNavbar>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/buy/:eventId" element={<BuyTicketPage />} />
          <Route path="/ticket/:submissionId" element={<ViewTicketPage />} />

          {/* Auth redirect */}
          <Route path="/dashboard" element={<AuthRedirect />} />

          {/* Protected routes - no navbar (they have their own headers) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <ProtectedRoute requiredRole="seller">
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;