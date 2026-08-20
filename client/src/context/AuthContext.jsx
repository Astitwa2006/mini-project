import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => handleSession(session))
      .catch(() => handleSession(null));

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(session) {
    if (session?.user) {
      setUser(session.user);
      // Store token for REST calls
      localStorage.setItem('sb-token', session.access_token);
      try {
        const { profile } = await api.upsertProfile({});
        setProfile(profile);
      } catch { /* profile fetch failed, continue */ }
    } else {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('sb-token');
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/lobby` },
    });
    if (error) throw error;
  }

  // Anonymous session for the "join with a code, no account" path. Requires
  // Anonymous Sign-ins to be enabled in the Supabase project's Auth settings.
  async function signInAsGuest(nickname, tileColor) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    await handleSession(data.session);
    const { profile: updated } = await api.upsertProfile({ username: nickname, tileColor, onboarded: true });
    setProfile(updated);
  }

  // Re-pulls the profile row after onboarding writes to it, so ProtectedRoute's
  // `profile.onboarded` check reflects the change without a full reload.
  async function refreshProfile() {
    try {
      const { profile: updated } = await api.getMe();
      setProfile(updated);
      return updated;
    } catch {
      return profile;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-token');
    setUser(null);
    setProfile(null);
  }

  const token = localStorage.getItem('sb-token');

  return (
    <AuthContext.Provider value={{ user, profile, loading, token, signInWithGoogle, signInAsGuest, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
