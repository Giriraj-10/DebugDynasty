import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-stormy-teal border-t-turquoise rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Checking credentials...</span>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with correct role context
    return <Navigate to={`/login?role=${allowedRole}`} replace />;
  }

  if (user.role !== allowedRole) {
    // If logged in but accessing wrong portal, redirect to correct portal
    console.warn(`Access denied. User role ${user.role} tried accessing ${allowedRole} path.`);
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  }

  return children;
};
