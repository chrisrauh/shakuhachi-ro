import {
  getSupabase,
  whenSupabaseLoaded,
  SESSION_STORAGE_KEY,
} from './supabase';
import type {
  User,
  Session,
  AuthError,
  SupabaseClient,
} from '@supabase/supabase-js';

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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

function hasStoredSession(): boolean {
  return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
}

/**
 * Subscribe to auth state with deduplication.
 *
 * Fires callback on first event (initial state) and whenever user changes.
 * Ignores TOKEN_REFRESHED and other events where user ID stays the same.
 *
 * With no session stored in this browser, reports "signed out" without loading
 * the Supabase client, and starts listening once something else loads it:
 * signing in, or a sign-in in another tab.
 *
 * @param callback Called with user on initial load and when user changes
 * @returns Subscription to unsubscribe when done
 */
export function onAuthReady(callback: (user: User | null) => void): {
  unsubscribe: () => void;
} {
  // undefined = "never initialized" (different from null = "no user")
  let currentUserId: string | null | undefined = undefined;
  let unsubscribed = false;
  let unsubscribeFromClient = () => {};

  const report = (user: User | null) => {
    if (unsubscribed) return;
    const newUserId = user?.id ?? null;
    // Fire on first event (undefined) or when user actually changes
    if (currentUserId === undefined || currentUserId !== newUserId) {
      currentUserId = newUserId;
      callback(user);
    }
  };

  const listen = (supabase: SupabaseClient) => {
    if (unsubscribed) return;
    // Supabase repeats the current state to a new listener; report() drops it
    // when it matches what was already reported
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      report(session?.user ?? null);
    });
    unsubscribeFromClient = () => subscription.unsubscribe();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_STORAGE_KEY && event.newValue !== null) {
      void getSupabase();
    }
  };

  if (hasStoredSession()) {
    void getSupabase().then(listen);
  } else {
    // Asynchronously, as Supabase's first event is: callers subscribe before
    // they finish setting up
    queueMicrotask(() => report(null));
    void whenSupabaseLoaded().then(listen);
    window.addEventListener('storage', onStorage);
  }

  return {
    unsubscribe: () => {
      unsubscribed = true;
      unsubscribeFromClient();
      window.removeEventListener('storage', onStorage);
    },
  };
}
