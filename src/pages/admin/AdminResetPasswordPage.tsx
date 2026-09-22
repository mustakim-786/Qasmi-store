import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useRouter } from '../../context/RouterContext';

export default function AdminResetPasswordPage() {
  const { updatePassword, signOut } = useAdminAuth();
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      await signOut();
      navigate('/admin');
    } catch {
      setError('We could not update the password. Request another reset link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-xl sm:p-9" aria-labelledby="reset-title">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><KeyRound size={28} aria-hidden="true" /></div>
          <h1 id="reset-title" className="font-display text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-600">After changing it, sign in again and complete your authenticator check.</p>
        </div>
        <div className="space-y-5">
          <div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-gray-700">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
          <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-gray-700">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
          <div aria-live="polite">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>
          <button disabled={loading} className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">{loading ? 'Saving…' : 'Save new password'}</button>
        </div>
      </form>
    </main>
  );
}
