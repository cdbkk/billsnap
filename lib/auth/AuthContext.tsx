import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Analytics } from '../analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && __DEV__) {
        console.error('Error getting session:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          if (__DEV__) console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          if (__DEV__) console.log('User signed out');
          Analytics.signOut();
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Identify user for analytics
          const method = session.user.app_metadata?.provider === 'google' ? 'google' : 'email';
          Analytics.identify(session.user.id, {
            email: session.user.email,
            provider: method,
          });
          Analytics.signIn(method);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Refresh session when app comes to foreground
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          if (__DEV__) console.log('App became active, refreshing session');
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error && __DEV__) {
              console.error('Error refreshing session:', error.message);
            } else if (session) {
              setSession(session);
              setUser(session.user);
            }
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
