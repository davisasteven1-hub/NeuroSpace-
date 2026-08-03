import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getFriendlyAuthError, useAuth } from '../../context/AuthContext';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthPageLayout } from './AuthPageLayout';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string }; message?: string } | null)?.from?.pathname ?? '/dashboard';
  const successMessage = (location.state as { message?: string } | null)?.message ?? '';

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (authError) {
      setError(getFriendlyAuthError(authError, 'Unable to sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthPageLayout title="Access Terminal" subtitle="Sign in to continue to your academic operating system." footer={<><span>New operator? </span><Link to="/signup" className="text-safe hover:text-white">Create account</Link></>}>
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Password<PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} required className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      {successMessage && <p className="text-[10px] uppercase tracking-wider text-safe">{successMessage}</p>}
      {error && <p className="text-[10px] uppercase tracking-wider text-panic">{error}</p>}
      <button disabled={submitting} className="border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 disabled:opacity-50">{submitting ? 'Verifying...' : 'Sign in'}</button>
      <Link to="/forgot-password" className="text-center text-[10px] uppercase tracking-widest text-gray-500 hover:text-safe">Forgot password?</Link>
    </form>
  </AuthPageLayout>;
}
