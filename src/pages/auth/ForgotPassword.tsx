import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriendlyAuthError, useAuth } from '../../context/AuthContext';
import { AuthPageLayout } from './AuthPageLayout';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('If an account exists, a reset link has been sent.');
    } catch (authError) {
      setError(getFriendlyAuthError(authError, 'Unable to send the reset email.'));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthPageLayout title="Recovery Channel" subtitle="Enter your email address to request a password reset link." footer={<Link to="/login" className="text-safe hover:text-white">Return to sign in</Link>}>
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[10px] uppercase tracking-widest text-gray-500">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe" /></label>
      {error && <p className="text-[10px] uppercase tracking-wider text-panic">{error}</p>}
      {message && <p className="text-[10px] uppercase tracking-wider text-safe">{message}</p>}
      <button disabled={submitting} className="border border-safe text-safe py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 disabled:opacity-50">{submitting ? 'Sending...' : 'Send reset link'}</button>
    </form>
  </AuthPageLayout>;
}
