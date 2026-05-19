/**
 * AuthContext — singleton auth state shared across the entire app.
 *
 * Before this, every component calling useAuth() fired its own
 * `users?id=eq.*` query on mount. Now the fetch runs once in the
 * Provider and all consumers share the same object via Context.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type AppUser = Tables<'users'>;

interface AuthState {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  isTeacher: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser(id: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    setUser(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // Seed from current session (avoids a round-trip on cold start)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUser(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchUser(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      isAdmin:   user?.role === 'admin',
      isTeacher: user?.role === 'teacher',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Drop-in replacement for the old hook — now reads from Context, no fetch. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
