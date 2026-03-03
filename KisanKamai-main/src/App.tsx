import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import AddEquipment from './pages/AddEquipment';
import MyEquipment from './pages/MyEquipment';
import EquipmentDetails from './pages/EquipmentDetails';
import RenterDashboard from './pages/RenterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

const AppContent = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {!isRegisterPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/owner-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/owner/add-equipment" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
              <AddEquipment />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/owner/my-equipment" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
              <MyEquipment />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/equipment/:id" 
          element={
            <EquipmentDetails />
          } 
        />
        
        <Route 
          path="/renter-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.RENTER]}>
              <RenterDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
