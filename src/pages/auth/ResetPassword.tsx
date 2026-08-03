import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthPageLayout } from './AuthPageLayout';

type ViewState = 'loading' | 'valid' | 'expired' | 'invalid' | 'success';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check for recovery session on page load
    // Supabase automatically restores the session from URL tokens
    const checkRecoverySession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking recovery session:', error);
        setViewState('invalid');
        return;
      }

      if (!session) {
        setViewState('invalid');
        return;
      }

      // Check if the session is valid by trying to get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setViewState('expired');
        return;
      }

      setViewState('valid');
    };

    checkRecoverySession();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }

      setViewState('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update password.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (viewState === 'loading') {
    return (
      <AuthPageLayout 
        title="Reset Password" 
        subtitle="Verifying your reset link..." 
        footer={<Link to="/login" className="text-safe hover:text-white">Return to sign in</Link>}
      >
        <div className="mt-6 text-center">
          <div className="inline-block w-6 h-6 border-2 border-safe border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthPageLayout>
    );
  }

  if (viewState === 'expired') {
    return (
      <AuthPageLayout 
        title="Link Expired" 
        subtitle="Your password reset link has expired." 
        footer={<Link to="/forgot-password" className="text-safe hover:text-white">Request a new reset link</Link>}
      >
        <div className="mt-6">
          <p className="text-xs text-gray-400 leading-relaxed">
            Password reset links are valid for a limited time. Please request a new password reset email to continue.
          </p>
        </div>
      </AuthPageLayout>
    );
  }

  if (viewState === 'invalid') {
    return (
      <AuthPageLayout 
        title="Invalid Link" 
        subtitle="This password reset link is invalid." 
        footer={<Link to="/forgot-password" className="text-safe hover:text-white">Request a new reset link</Link>}
      >
        <div className="mt-6">
          <p className="text-xs text-gray-400 leading-relaxed">
            The reset link you clicked is either malformed or has already been used. Please request a new password reset email.
          </p>
        </div>
      </AuthPageLayout>
    );
  }

  if (viewState === 'success') {
    return (
      <AuthPageLayout 
        title="Password Updated" 
        subtitle="Your password has been successfully reset." 
        footer={<Link to="/login" className="text-safe hover:text-white">Sign in with new password</Link>}
      >
        <div className="mt-6">
          <p className="text-xs text-safe leading-relaxed">
            Redirecting to sign in page...
          </p>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout 
      title="Reset Password" 
      subtitle="Enter your new password below." 
      footer={<Link to="/login" className="text-safe hover:text-white">Return to sign in</Link>}
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
          New Password
          <PasswordInput 
            value={password} 
            onChange={(event) => setPassword(event.target.value)} 
            required 
            className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" 
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">
          Confirm Password
          <PasswordInput 
            value={confirmPassword} 
            onChange={(event) => setConfirmPassword(event.target.value)} 
            required 
            className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" 
          />
        </label>
        {error && <p className="text-[10px] uppercase tracking-wider text-panic">{error}</p>}
        <button 
          disabled={submitting} 
          className="border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 disabled:opacity-50"
        >
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthPageLayout>
  );
}
