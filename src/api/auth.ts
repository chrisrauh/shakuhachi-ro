import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current user session
 */
export async function getCurrentSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    error,
  };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
  });

  return subscription;
}
