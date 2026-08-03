import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getAuthCallbackUrl, getPasswordResetUrl } from '../lib/authRedirect';
import { createProfileIfMissing, fetchProfilePictureUrl, removeProfilePicture, saveProfilePicture, updateProfile as persistProfile } from '../services/profileService';
import { initializeUserData } from '../services/userDataService';
import type { Profile } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  avatarUrl: string | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateCurrentProfile: (displayName: string) => Promise<void>;
  uploadAvatar: (dataUrl: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

export function getFriendlyAuthError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('rate limit') || message.includes('email rate limit')) return 'You have requested too many emails. Please wait a few minutes before trying again.';
  if (message.includes('already registered') || message.includes('already exists') || message.includes('duplicate')) return 'This email already has an account. Please sign in instead.';
  if (message.includes('invalid login credentials') || message.includes('invalid password')) return 'Incorrect email or password. Please try again.';
  if (message.includes('email not confirmed')) return 'Please verify your email before signing in.';
  if (message.includes('network') || message.includes('fetch')) return 'Network error. Check your connection and try again.';
  return fallback;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadProfile = async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setAvatarUrl(null);
      return;
    }
    const displayName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name : null;
    const nextProfile = await createProfileIfMissing(user.id, displayName);
    await initializeUserData(user.id);
    setProfile(nextProfile);
    setAvatarUrl(await fetchProfilePictureUrl(user.id));
  };

  useEffect(() => {
    void supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        setSession(data.session);
        await loadProfile(data.session?.user ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession?.user ?? null).catch(console.error);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    profile,
    avatarUrl,
    loading,
    signUp: async (email, password, displayName) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() }, emailRedirectTo: getAuthCallbackUrl() },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Unable to create account.');
      if (data.session) await loadProfile(data.user);
      return { requiresEmailConfirmation: !data.session };
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setProfile(null);
      setAvatarUrl(null);
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetUrl(),
      });
      if (error) throw error;
    },
    updatePassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    updateCurrentProfile: async (displayName) => {
      if (!session?.user) throw new Error('Session expired. Please sign in again.');
      const nextProfile = await persistProfile(session.user.id, { display_name: displayName.trim() || null, profile_picture_url: profile?.profile_picture_url ?? null });
      setProfile(nextProfile);
    },
    uploadAvatar: async (dataUrl) => {
      if (!session?.user) throw new Error('Session expired. Please sign in again.');
      const signedUrl = await saveProfilePicture(session.user.id, dataUrl);
      if (!signedUrl) throw new Error('Storage upload failed.');
      const nextProfile = await createProfileIfMissing(session.user.id);
      setProfile(nextProfile);
      setAvatarUrl(signedUrl);
    },
    removeAvatar: async () => {
      if (!session?.user) throw new Error('Session expired. Please sign in again.');
      if (!await removeProfilePicture(session.user.id)) throw new Error('Unable to remove profile picture.');
      const nextProfile = await createProfileIfMissing(session.user.id);
      setProfile(nextProfile);
      setAvatarUrl(null);
    },
  }), [avatarUrl, loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
