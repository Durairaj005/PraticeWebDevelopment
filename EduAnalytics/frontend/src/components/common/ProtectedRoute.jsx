import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole }) {
  // TODO: Get auth state from context
  const isAuthenticated = true; // Placeholder
  const userRole = 'student'; // Placeholder

  if (!isAuthenticated) {
    return <Navigate to="/auth/student-login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
