import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { getFriendlyAuthError, useAuth } from '../../context/AuthContext';
import { AuthPageLayout } from '../auth/AuthPageLayout';
import { AdminApiError, type AdminCheckResponse, verifyAdminAccess } from '../../services/adminApi';
import { supabase } from '../../lib/supabase';

type AdminLoginState = {
  from?: { pathname?: string };
  message?: string;
};

function isAuthorizedAdmin(authenticatedUserId: string, payload: AdminCheckResponse): boolean {
  return payload.authenticatedUserId === authenticatedUserId && payload.adminUserId === authenticatedUserId;
}

export default function AdminLogin() {
  const { session, loading, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = useMemo(() => (location.state as AdminLoginState | null) ?? null, [location.state]);
  const from = state?.from?.pathname ?? '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(state?.message ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [checkingExistingSession, setCheckingExistingSession] = useState(false);
  const [existingNonAdmin, setExistingNonAdmin] = useState(false);

  useEffect(() => {
    setError(state?.message ?? '');
  }, [state?.message]);

  useEffect(() => {
    let cancelled = false;

    const validateExistingSession = async () => {
      if (loading || !session?.access_token) {
        if (!cancelled) {
          setCheckingExistingSession(false);
          setExistingNonAdmin(false);
        }
        return;
      }

      setCheckingExistingSession(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw userError ?? new Error('Administrator session could not be established.');
        }

        const verification = await verifyAdminAccess(session.access_token);
        if (!isAuthorizedAdmin(userData.user.id, verification)) {
          throw new AdminApiError('You do not have administrator access.', 403, 'not_admin');
        }

        if (!cancelled) navigate('/admin/dashboard', { replace: true });
      } catch (cause) {
        if (cause instanceof AdminApiError && (cause.status === 401 || cause.status === 403)) {
          await signOut().catch(() => undefined);
        }
        if (!cancelled) {
          setExistingNonAdmin(cause instanceof AdminApiError && cause.status === 403);
          setError(cause instanceof Error ? cause.message : 'You do not have administrator access.');
        }
      } finally {
        if (!cancelled) setCheckingExistingSession(false);
      }
    };

    void validateExistingSession();

    return () => {
      cancelled = true;
    };
  }, [loading, navigate, session?.access_token, signOut]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setExistingNonAdmin(false);

    try {
      await signIn(email, password);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw userError ?? new Error('Administrator session could not be established.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw sessionError ?? new Error('Administrator session could not be established.');
      }

      try {
        const verification = await verifyAdminAccess(sessionData.session.access_token);
        if (!isAuthorizedAdmin(userData.user.id, verification)) {
          throw new AdminApiError('You do not have administrator access.', 403, 'not_admin');
        }
        navigate(from, { replace: true });
      } catch (cause) {
        if (cause instanceof AdminApiError && (cause.status === 401 || cause.status === 403)) {
          await signOut().catch(() => undefined);
        }
        setExistingNonAdmin(cause instanceof AdminApiError && cause.status === 403);
        setError(
          cause instanceof AdminApiError && (cause.status === 401 || cause.status === 403)
            ? 'You do not have administrator access.'
            : cause instanceof Error
              ? cause.message
              : 'Unable to validate administrator access.',
        );
      }
    } catch (cause) {
      if (cause instanceof AdminApiError) {
        setError(cause.message);
        return;
      }

      setError(getFriendlyAuthError(cause, 'Unable to sign in to the administrator portal.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      title="Administrator Access"
      subtitle="Restricted terminal for super administrators only. Student access remains on the standard NeuroSpace login."
      footer={(
        <>
          <span>Need the student portal? </span>
          <Link to="/login" className="text-safe hover:text-white">Back to Student Login</Link>
        </>
      )}
    >
      <div className="mt-6 border border-safe/20 bg-safe/10 p-3 text-[10px] uppercase tracking-widest text-safe">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} />
          Hidden super admin entry point
        </div>
      </div>

      {existingNonAdmin && (
        <div className="mt-4 border border-panic/30 bg-panic/10 p-4 text-xs text-gray-300">
          <p className="flex items-start gap-2 text-panic">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            The current signed-in account is not registered in the administrator directory.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:border-safe hover:text-safe"
            >
              <ArrowLeft size={14} />
              Student Login
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            disabled={submitting || checkingExistingSession}
            className="border border-gray-800 bg-void px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
          Password
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            disabled={submitting || checkingExistingSession}
            className="border border-gray-800 bg-void px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe disabled:opacity-60"
          />
        </label>
        {error && (
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-panic">
            <AlertTriangle size={12} />
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || checkingExistingSession}
          className="border border-safe py-2 text-[10px] font-bold uppercase tracking-widest text-safe hover:bg-safe/10 disabled:opacity-50"
        >
          {submitting || checkingExistingSession ? 'Validating...' : 'Enter Admin Control Center'}
        </button>
        <Link
          to="/login"
          className="text-center text-[10px] uppercase tracking-widest text-gray-500 transition-colors hover:text-safe"
        >
          Back to Student Login
        </Link>
      </form>
    </AuthPageLayout>
  );
}
