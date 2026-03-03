import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-stone-500 animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles) {
    if (!profile) {
      // If user is logged in but profile is missing, it might be a race condition.
      // Show loading for a bit longer.
      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-stone-500 animate-pulse">Syncing your profile...</p>
            </div>
          </div>
        );
      }
      
      console.warn("ProtectedRoute: Profile missing for user", user.uid);
      return <Navigate to="/" />;
    }

    // If the user is an admin, allow everything
    if (profile.role === UserRole.ADMIN) return <>{children}</>;
    
    // Otherwise check if the role matches
    if (!allowedRoles.includes(profile.role)) {
      console.log(`ProtectedRoute: Role mismatch. User is ${profile.role}, but route requires ${allowedRoles.join(', ')}`);
      if (profile.role === UserRole.OWNER) return <Navigate to="/owner-dashboard" />;
      if (profile.role === UserRole.RENTER) return <Navigate to="/renter-dashboard" />;
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
