import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';

/**
 * Protected Route Props
 */
interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Stores attempted URL to redirect after successful login
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Checking authentication..." />
      </div>
    );
  }

  // If not authenticated, redirect to login and store the attempted location
  if (!isAuthenticated) {
    // Store the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return children;
}
