import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { dataService } from '@/data/dataService';

type AdminAuthStatus = 'loading' | 'signed_out' | 'enroll_mfa' | 'challenge_mfa' | 'ready';

interface MfaEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

interface AdminAuthContextValue {
  status: AdminAuthStatus;
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  startMfaEnrollment: () => Promise<MfaEnrollment>;
  verifyMfaEnrollment: (factorId: string, code: string) => Promise<void>;
  verifyMfaChallenge: (code: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function siteUrl() {
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const idleTimer = useRef<number | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const signOut = useCallback(async () => {
    clearIdleTimer();
    dataService.clearCache();
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setStatus('signed_out');
  }, [clearIdleTimer]);

  const evaluateSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setStatus('signed_out');
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', nextSession.user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      dataService.clearCache();
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      setStatus('signed_out');
      throw new Error('This account is not authorized to access the admin panel.');
    }

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel === 'aal2') {
      setStatus('ready');
      return;
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    setStatus(factors.totp.length > 0 ? 'challenge_mfa' : 'enroll_mfa');
  }, []);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) await evaluateSession(data.session);
      } catch {
        if (mounted) setStatus('signed_out');
      }
    };
    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        if (mounted) void evaluateSession(nextSession).catch(() => setStatus('signed_out'));
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [evaluateSession]);

  useEffect(() => {
    if (status !== 'ready') {
      clearIdleTimer();
      return;
    }
    const resetTimer = () => {
      clearIdleTimer();
      idleTimer.current = window.setTimeout(() => void signOut(), IDLE_TIMEOUT_MS);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearIdleTimer();
    };
  }, [clearIdleTimer, signOut, status]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error('Unable to sign in with those details.');
    await evaluateSession(data.session);
  }, [evaluateSession]);

  const startMfaEnrollment = useCallback(async (): Promise<MfaEnrollment> => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Qasmi Store Admin' });
    if (error) throw error;
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  }, []);

  const verifyMfaEnrollment = useCallback(async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    await evaluateSession(data.session);
  }, [evaluateSession]);

  const verifyMfaChallenge = useCallback(async (code: string) => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const factor = factors.totp[0];
    if (!factor) throw new Error('No authenticator app is enrolled for this account.');
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) throw challengeError;
    const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: code.trim() });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    await evaluateSession(data.session);
  }, [evaluateSession]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl().replace(/\/$/, '')}/admin/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      status,
      session,
      user: session?.user || null,
      isAuthenticated: status === 'ready',
      signIn,
      signOut,
      startMfaEnrollment,
      verifyMfaEnrollment,
      verifyMfaChallenge,
      sendPasswordReset,
      updatePassword,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
