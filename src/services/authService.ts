import { supabase } from '../lib/supabase';

export async function getSessionUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user.id ?? null;
}

export async function ensureAuthenticatedUser(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('No authenticated user is available.');
  return userId;
}

export function subscribeToAuthChanges(callback: (userId: string | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user.id ?? null));
  return () => data.subscription.unsubscribe();
}
