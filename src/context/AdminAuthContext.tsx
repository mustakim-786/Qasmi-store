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

type AdminAuthStatus = 'loading' | 'signed_out' | 'ready';

interface AdminAuthContextValue {
  status: AdminAuthStatus;
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

    setStatus('ready');
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
