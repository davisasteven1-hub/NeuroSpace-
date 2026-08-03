import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriendlyAuthError, useAuth } from '../../context/AuthContext';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthPageLayout } from './AuthPageLayout';

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await signUp(email, password, displayName);
      setMessage(result.requiresEmailConfirmation ? 'Account created successfully. Please check your email to verify your account before signing in.' : 'Account created successfully. You can now continue to your workspace.');
    } catch (authError) {
      setError(getFriendlyAuthError(authError, 'Unable to create account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthPageLayout title="Register Operator" subtitle="Create credentials for your NeuroSpace workspace." footer={<><span>Already registered? </span><Link to="/login" className="text-safe hover:text-white">Sign in</Link></>}>
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Display Name<input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Password<PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      {error && <p className="text-[10px] uppercase tracking-wider text-panic">{error}</p>}
      {message && <p className="text-[10px] uppercase tracking-wider text-safe">{message}</p>}
      <button disabled={submitting} className="border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 disabled:opacity-50">{submitting ? 'Creating...' : 'Create account'}</button>
    </form>
  </AuthPageLayout>;
}
