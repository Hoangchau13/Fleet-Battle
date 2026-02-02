import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    // Chưa đăng nhập, redirect đến login
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập, render children
  return children;
}

export default ProtectedRoute;
