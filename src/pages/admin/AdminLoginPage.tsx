import { FormEvent, useState } from 'react';
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLang } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';

export default function AdminLoginPage() {
  const { signIn, sendPasswordReset } = useAdminAuth();
  const { t } = useLang();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (resetMode) {
        await sendPasswordReset(email);
        setMessage('If this email is eligible, a password-reset link has been sent.');
        return;
      }

      await signIn(email, password);
    } catch {
      setError('We could not sign you in with those details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-xl sm:p-9" aria-labelledby="admin-login-title">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t('Back to store', 'اسٹور پر واپس')}
        </button>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            {resetMode ? <KeyRound size={27} aria-hidden="true" /> : <Lock size={27} aria-hidden="true" />}
          </div>
          <h1 id="admin-login-title" className="font-display text-2xl font-bold text-gray-900">
            {resetMode ? 'Reset administrator password' : t('Admin Login', 'ایڈمن لاگ ان')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {resetMode
              ? 'Enter your email and we will send a secure reset link if it is eligible.'
              : 'Use your administrator email and password to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-gray-700">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={19} aria-hidden="true" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {!resetMode && (
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={19} aria-hidden="true" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <div aria-live="polite">
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
            {loading ? 'Please wait…' : resetMode ? 'Send reset link' : t('Sign In', 'سائن ان')}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setResetMode((current) => !current);
            setError(null);
            setMessage(null);
          }}
          className="mt-5 w-full text-center text-sm font-medium text-orange-700 hover:text-orange-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded"
        >
          {resetMode ? 'Return to sign in' : 'Forgot your password?'}
        </button>
      </section>
    </main>
  );
}
