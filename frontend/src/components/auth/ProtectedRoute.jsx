import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state if auth is still being determined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && (!user.role || user.role !== requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required role (if any)
  return children;
};

export default ProtectedRoute; 
 
 