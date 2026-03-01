import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import Auth from '@/pages/Auth';
import PatientDashboard from '@/pages/PatientDashboard';
import DoctorDashboard from '@/pages/DoctorDashboard';
import DoctorVerification from '@/pages/DoctorVerification';
import DoctorSearch from '@/pages/DoctorSearch';
import Profile from '@/pages/Profile';
import ChatWithDoctor from '@/pages/ChatWithDoctor';
import ChatWithAI from '@/pages/ChatWithAI';
import VideoCall from '@/pages/VideoCall';
import DoctorNetwork from '@/pages/DoctorNetwork';
import AppointmentsCalendar from '@/pages/AppointmentsCalendar';
import Recommendations from '@/pages/Recommendations';
import Documents from '@/pages/Documents';
import Privacy from '@/pages/Privacy';
import PatientHistory from '@/pages/PatientHistory';
import '@/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // If showing auth modal
  if (showAuth && !token) {
    return (
      <>
        <Auth onLogin={handleLogin} onClose={() => setShowAuth(false)} />
        <Toaster />
      </>
    );
  }

  // If not logged in, show landing page
  if (!token || !user) {
    return (
      <>
        <LandingPage onShowAuth={() => setShowAuth(true)} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            user.role === 'patient' ? 
            <PatientDashboard user={user} onLogout={handleLogout} /> : 
            <DoctorDashboard user={user} onLogout={handleLogout} />
          } />
          <Route path="/profile" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <Profile user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/search-doctors" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <DoctorSearch user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/verification" element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorVerification user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/chat-doctor" element={
            <ProtectedRoute user={user}>
              <ChatWithDoctor user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/chat-ai" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <ChatWithAI user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/video-call" element={
            <ProtectedRoute user={user}>
              <VideoCall user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/doctor-network" element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorNetwork user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute user={user}>
              <AppointmentsCalendar user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/recommendations" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <Recommendations user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <Documents user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/privacy" element={
            <ProtectedRoute user={user} requiredRole="patient">
              <Privacy user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/patient-history" element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <PatientHistory user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
