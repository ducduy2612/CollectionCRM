import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAll = false
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0 && user) {
    const userPermissions = user.permissions || [];
    
    const hasPermission = requireAll
      ? requiredPermissions.every(permission =>
          userPermissions.some(userPerm => userPerm.startsWith(permission + ':') || userPerm === permission)
        )
      : requiredPermissions.some(permission =>
          userPermissions.some(userPerm => userPerm.startsWith(permission + ':') || userPerm === permission)
        );

    if (!hasPermission) {
      // Redirect to dashboard or show unauthorized page
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
