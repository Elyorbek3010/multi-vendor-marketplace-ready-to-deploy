import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, vendorOnly = false }) {
  const { user, isVendor } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (vendorOnly && !isVendor) {
    return <Navigate to="/" replace />;
  }

  return children;
}
