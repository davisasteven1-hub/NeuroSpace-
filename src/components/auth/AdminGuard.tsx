import { useEffect, useState, type PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminApiError, verifyAdminAccess } from '../../services/adminApi';

type GuardState = 'checking' | 'allowed' | 'denied';

export function AdminGuard({ children }: PropsWithChildren) {
  const { session, loading, signOut } = useAuth();
  const location = useLocation();
  const [guardState, setGuardState] = useState<GuardState>('checking');
  const [message, setMessage] = useState('Please sign in to access administrator tools.');

  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      if (loading) return;

      if (!session?.access_token) {
        if (!cancelled) {
          setMessage('Please sign in to access administrator tools.');
          setGuardState('denied');
        }
        return;
      }

      try {
        await verifyAdminAccess(session.access_token);
        if (!cancelled) setGuardState('allowed');
      } catch (error) {
        if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
          await signOut().catch(() => undefined);
        }
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'You do not have administrator access.');
          setGuardState('denied');
        }
      }
    };

    setGuardState('checking');
    void validate();

    return () => {
      cancelled = true;
    };
  }, [loading, location.pathname, session?.access_token, signOut]);

  if (loading || guardState === 'checking') {
    return (
      <div className="min-h-screen bg-void bg-grid flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-gray-800 bg-surface p-6 font-mono">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Admin Verification</p>
          <h1 className="mt-3 text-xl font-bold uppercase tracking-wide text-white">Validating access level...</h1>
          <p className="mt-3 text-xs leading-relaxed text-gray-400">
            Confirming authenticated session and administrator registry status.
          </p>
        </div>
      </div>
    );
  }

  if (guardState === 'denied') {
    return <Navigate to="/admin/login" replace state={{ from: location, message }} />;
  }

  return <>{children}</>;
}
