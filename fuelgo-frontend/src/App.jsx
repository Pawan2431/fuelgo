import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TwoFactorPage from './pages/TwoFactorPage';
import HomePage from './pages/HomePage';
import TrackingPage from './pages/TrackingPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { isAuthenticated, is2FAVerified, user } = useContext(AuthContext);
  
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!is2FAVerified) return <Navigate to="/2fa" replace />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/home" replace />;
  
  return children;
};

const AppContent = () => {
  return (
    <div className="app-viewport">
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />

        {/* App Routes */}
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboardPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
