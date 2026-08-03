import { FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, LoaderCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth, getFriendlyAuthError } from '../../context/AuthContext';
import { PasswordInput } from '../../components/auth/PasswordInput';
import {
  classifyAuthCallbackError,
  clearAuthCallbackParamsFromUrl,
  mapSessionErrorToKind,
  parseAuthCallbackUrl,
  type AuthCallbackType,
} from '../../lib/authCallbackParams';

type CallbackView =
  | 'loading'
  | 'already_logged_in'
  | 'email_verified'
  | 'redirect_to_reset'
  | 'password_reset_form'
  | 'password_updated'
  | 'login_success'
  | 'invalid_token'
  | 'expired_token'
  | 'error';

const REDIRECT_DELAY_MS = 2000;

function CallbackLayout({
  title,
  children,
  tone = 'neutral',
}: {
  title: string;
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'error';
}) {
  const accent =
    tone === 'success' ? 'border-safe/40' :
    tone === 'error' ? 'border-panic/40' :
    'border-gray-800';

  return (
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4 font-mono">
      <div className={`w-full max-w-md border-2 ${accent} bg-surface p-6 relative`}>
        <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />
        <h1 className="text-lg font-bold uppercase tracking-wide text-white mb-4">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function resolveSuccessView(type: AuthCallbackType, hasSession: boolean): CallbackView {
  // For recovery flows (password reset), redirect to the dedicated reset password page
  // instead of handling the form inline in the callback
  if (type === 'recovery') {
    return 'redirect_to_reset';
  }
  if (type === 'signup' || type === 'email_change' || type === 'invite') {
    return hasSession ? 'login_success' : 'email_verified';
  }
  if (type === 'magiclink') {
    return hasSession ? 'login_success' : 'invalid_token';
  }
  return hasSession ? 'login_success' : 'email_verified';
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updatePassword } = useAuth();
  const [view, setView] = useState<CallbackView>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const processedRef = useRef(false);

  const parsed = useMemo(
    () => (typeof window !== 'undefined' ? parseAuthCallbackUrl(window.location.href) : null),
    [],
  );

  useEffect(() => {
    if (authLoading || processedRef.current) return;

    let cancelled = false;

    const processCallback = async () => {
      processedRef.current = true;
      if (!parsed) {
        setView('error');
        setErrorMessage('Unable to read the authentication response.');
        return;
      }

      if (parsed.error || parsed.errorDescription || parsed.errorCode) {
        const kind = classifyAuthCallbackError(parsed.error, parsed.errorDescription, parsed.errorCode);
        setView(kind === 'expired' ? 'expired_token' : kind === 'invalid' ? 'invalid_token' : 'error');
        setErrorMessage(parsed.errorDescription ?? parsed.error ?? 'Authentication could not be completed.');
        clearAuthCallbackParamsFromUrl();
        return;
      }

      const isRecoveryFlow = parsed.type === 'recovery';

      if (user && !isRecoveryFlow && parsed.type !== 'signup') {
        setView('already_logged_in');
        return;
      }

      try {
        if (parsed.authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.authCode);
          if (exchangeError) throw exchangeError;
        } else if (parsed.hasAuthTokens) {
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
        }

        const { data: sessionData, error: sessionReadError } = await supabase.auth.getSession();
        if (sessionReadError) throw sessionReadError;

        if (cancelled) return;

        const hasSession = Boolean(sessionData.session);
        const callbackType = parsed.type;

        if (!hasSession && !parsed.hasAuthTokens && !parsed.authCode) {
          setView('invalid_token');
          clearAuthCallbackParamsFromUrl();
          return;
        }

        setView(resolveSuccessView(callbackType, hasSession));
        clearAuthCallbackParamsFromUrl();
      } catch (cause) {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : 'Authentication link expired or invalid.';
        const kind = mapSessionErrorToKind(message);
        setView(kind === 'expired' ? 'expired_token' : kind === 'invalid' ? 'invalid_token' : 'error');
        setErrorMessage(message);
        clearAuthCallbackParamsFromUrl();
      }
    };

    void processCallback();

    return () => {
      cancelled = true;
    };
  }, [authLoading, parsed, user]);

  useEffect(() => {
    if (view === 'redirect_to_reset') {
      // Redirect to the dedicated reset password page
      navigate('/auth/reset-password', { replace: true });
      return;
    }

    if (view !== 'already_logged_in' && view !== 'login_success' && view !== 'password_updated') return;

    setRedirectCountdown(2);
    const interval = window.setInterval(() => {
      setRedirectCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    const timeout = window.setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [view, navigate]);

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await updatePassword(password);
      setView('password_updated');
    } catch (cause) {
      setErrorMessage(getFriendlyAuthError(cause, 'Unable to update your password.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || view === 'loading') {
    return (
      <CallbackLayout title="Authenticating">
        <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-widest">
          <LoaderCircle size={14} className="animate-spin text-safe" />
          Completing authentication...
        </div>
      </CallbackLayout>
    );
  }

  if (view === 'already_logged_in') {
    return (
      <CallbackLayout title="Already signed in" tone="success">
        <p className="flex items-start gap-2 text-safe text-xs leading-relaxed">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          You are already signed in. Redirecting to Dashboard in {redirectCountdown}s...
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-[10px] uppercase tracking-widest text-safe hover:text-white">
          Go to Dashboard now
        </Link>
      </CallbackLayout>
    );
  }

  if (view === 'login_success') {
    return (
      <CallbackLayout title="Login successful" tone="success">
        <p className="flex items-start gap-2 text-safe text-xs leading-relaxed">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          Login successful. Redirecting to Dashboard in {redirectCountdown}s...
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-[10px] uppercase tracking-widest text-safe hover:text-white">
          Go to Dashboard now
        </Link>
      </CallbackLayout>
    );
  }

  if (view === 'email_verified') {
    return (
      <CallbackLayout title="Email verified" tone="success">
        <p className="flex items-start gap-2 text-safe text-xs leading-relaxed">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          Email verified successfully. You can now sign in.
        </p>
        <Link
          to="/login"
          state={{ message: 'Email verified successfully. You can now sign in.' }}
          className="mt-6 inline-flex items-center justify-center w-full border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10"
        >
          Go to Login
        </Link>
      </CallbackLayout>
    );
  }

  if (view === 'password_reset_form') {
    return (
      <CallbackLayout title="Choose a new password">
        <p className="flex items-start gap-2 text-safe text-xs leading-relaxed mb-4">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          Password reset verified. Please choose your new password.
        </p>
        <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
            New password
            <PasswordInput
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              disabled={submitting}
              className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
            Confirm password
            <PasswordInput
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              disabled={submitting}
              className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe"
            />
          </label>
          {errorMessage && (
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-panic">
              <AlertTriangle size={12} /> {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </CallbackLayout>
    );
  }

  if (view === 'password_updated') {
    return (
      <CallbackLayout title="Password updated" tone="success">
        <p className="flex items-start gap-2 text-safe text-xs leading-relaxed">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          Your password has been updated. Redirecting to Dashboard in {redirectCountdown}s...
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-[10px] uppercase tracking-widest text-safe hover:text-white">
          Go to Dashboard now
        </Link>
      </CallbackLayout>
    );
  }

  if (view === 'invalid_token') {
    return (
      <CallbackLayout title="Invalid link" tone="error">
        <p className="flex items-start gap-2 text-panic text-xs leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          This verification link is invalid. Please request another verification email.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/signup" className="text-center border border-gray-700 text-gray-300 py-2 text-[10px] uppercase tracking-widest hover:border-safe hover:text-safe">
            Create account
          </Link>
          <Link to="/forgot-password" className="text-center text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe">
            Request password reset
          </Link>
        </div>
      </CallbackLayout>
    );
  }

  if (view === 'expired_token') {
    return (
      <CallbackLayout title="Link expired" tone="error">
        <p className="flex items-start gap-2 text-panic text-xs leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          Your verification link has expired. Please request another verification email.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/signup" className="text-center border border-gray-700 text-gray-300 py-2 text-[10px] uppercase tracking-widest hover:border-safe hover:text-safe">
            Resend verification
          </Link>
          <Link to="/forgot-password" className="text-center text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe">
            Request password reset
          </Link>
        </div>
      </CallbackLayout>
    );
  }

  return (
    <CallbackLayout title="Authentication failed" tone="error">
      <p className="flex items-start gap-2 text-panic text-xs leading-relaxed">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        {errorMessage || 'Something went wrong while completing authentication.'}
      </p>
      <Link to="/login" className="mt-6 inline-block text-[10px] uppercase tracking-widest text-safe hover:text-white">
        Go to Login
      </Link>
    </CallbackLayout>
  );
}
