import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminMfaPage() {
  const {
    status,
    startMfaEnrollment,
    verifyMfaEnrollment,
    verifyMfaChallenge,
    signOut,
  } = useAdminAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(status === 'enroll_mfa');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'enroll_mfa' || factorId) return;
    let active = true;
    void startMfaEnrollment()
      .then((enrollment) => {
        if (!active) return;
        setFactorId(enrollment.factorId);
        setQrCode(enrollment.qrCode);
        setSecret(enrollment.secret);
      })
      .catch(() => active && setError('We could not set up your authenticator. Please sign out and try again.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [factorId, startMfaEnrollment, status]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (status === 'enroll_mfa') {
        if (!factorId) throw new Error('Authenticator setup is not ready yet.');
        await verifyMfaEnrollment(factorId, code);
      } else {
        await verifyMfaChallenge(code);
      }
    } catch {
      setError('The verification code was not accepted. Check your authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  };

  const enrolling = status === 'enroll_mfa';
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-xl sm:p-9" aria-labelledby="mfa-title">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <ShieldCheck size={28} aria-hidden="true" />
          </div>
          <h1 id="mfa-title" className="font-display text-2xl font-bold text-gray-900">
            {enrolling ? 'Secure your administrator account' : 'Verify your administrator account'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {enrolling
              ? 'Scan this QR code with an authenticator app, then enter the six-digit code.'
              : 'Enter the current six-digit code from your authenticator app.'}
          </p>
        </div>

        {enrolling && (
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
            {loading && !error ? <p className="text-sm text-gray-600">Preparing secure setup…</p> : qrCode ? (
              <img src={qrCode} alt="Authenticator setup QR code" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
            ) : null}
            {secret && <p className="mt-3 break-all text-xs text-gray-600">Manual key: <span className="font-mono font-semibold">{secret}</span></p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mfa-code" className="mb-2 block text-sm font-semibold text-gray-700">Authenticator code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={19} aria-hidden="true" />
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                disabled={loading || (enrolling && !factorId)}
                required
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 font-mono tracking-[0.35em] text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                placeholder="123456"
              />
            </div>
          </div>
          <div aria-live="polite">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>
          <button type="submit" disabled={loading || (enrolling && !factorId) || code.length !== 6} className="w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
            {loading ? 'Verifying…' : 'Continue securely'}
          </button>
        </form>

        <button type="button" onClick={() => void signOut()} className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded">
          <LogOut size={16} aria-hidden="true" /> Sign out
        </button>
      </section>
    </main>
  );
}
