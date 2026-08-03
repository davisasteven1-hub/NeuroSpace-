import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-void flex items-center justify-center text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Authenticating...</div>;
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
