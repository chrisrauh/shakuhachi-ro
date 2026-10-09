import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { signIn, onAuthReady as subscribe } from './auth';
import { getSupabase, SESSION_STORAGE_KEY } from './supabase';

const { supabase, resetLoaded, whenSupabaseLoaded, loadClient } = vi.hoisted(
  () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn(),
        onAuthStateChange: vi.fn(),
      },
    };
    let markLoaded = () => {};
    let loaded: Promise<typeof supabase>;
    const resetLoaded = () => {
      loaded = new Promise((resolve) => {
        markLoaded = () => resolve(supabase);
      });
    };
    resetLoaded();
    return {
      supabase,
      resetLoaded,
      whenSupabaseLoaded: () => loaded,
      loadClient: async () => {
        markLoaded();
        return supabase;
      },
    };
  },
);

vi.mock('./supabase', () => ({
  SESSION_STORAGE_KEY: 'sb-test-auth-token',
  getSupabase: vi.fn(loadClient),
  whenSupabaseLoaded,
}));

// Subscriptions left listening would see the next test's events
const subscriptions: { unsubscribe: () => void }[] = [];
afterEach(() => subscriptions.splice(0).forEach((s) => s.unsubscribe()));
const onAuthReady: typeof subscribe = (callback) => {
  const subscription = subscribe(callback);
  subscriptions.push(subscription);
  return subscription;
};

/** Lets pending promise callbacks run */
const settle = () => new Promise((resolve) => setTimeout(resolve));

type AuthListener = (event: string, session: Session | null) => void;

/** Captures the listener registered with Supabase, so tests can fire events */
function captureListener(): { emit: AuthListener } {
  let listener: AuthListener = () => {};
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(((
    callback: AuthListener,
  ) => {
    listener = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }) as never);
  return { emit: (event, session) => listener(event, session) };
}

function sessionFor(userId: string): Session {
  return { user: { id: userId } } as Session;
}

describe('signIn', () => {
  it('returns the user and session on success, and the error on failure', async () => {
    const session = sessionFor('u1');
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: session.user, session },
      error: null,
    } as never);
    const error = { message: 'Invalid login credentials' };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error,
    } as never);

    expect(await signIn('a@b.c', 'right')).toEqual({
      user: session.user,
      session,
      error: null,
    });
    expect(await signIn('a@b.c', 'wrong')).toEqual({
      user: null,
      session: null,
      error,
    });
  });
});

describe('onAuthReady, with a session stored in this browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(SESSION_STORAGE_KEY, '{}');
  });

  it('fires once with the initial state, even when signed out', async () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);
    await settle();

    emit('INITIAL_SESSION', null);

    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('ignores events that keep the same user, such as token refreshes', async () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);
    await settle();

    emit('INITIAL_SESSION', sessionFor('u1'));
    emit('TOKEN_REFRESHED', sessionFor('u1'));
    emit('SIGNED_IN', sessionFor('u1'));

    expect(callback).toHaveBeenCalledOnce();
  });

  it('fires again when the user signs out, signs in or changes', async () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);
    await settle();

    emit('INITIAL_SESSION', sessionFor('u1'));
    emit('SIGNED_OUT', null);
    emit('SIGNED_IN', sessionFor('u2'));

    expect(callback.mock.calls.map(([user]) => user?.id ?? null)).toEqual([
      'u1',
      null,
      'u2',
    ]);
  });
});

describe('onAuthReady, with no session stored in this browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetLoaded();
  });

  it('reports signed out without loading the Supabase client', async () => {
    const callback = vi.fn();
    onAuthReady(callback);
    await settle();

    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
    expect(getSupabase).not.toHaveBeenCalled();
  });

  it('reports the user once something loads the client, such as signing in', async () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);
    await settle();

    await getSupabase();
    await settle();
    emit('INITIAL_SESSION', null);
    emit('SIGNED_IN', sessionFor('u1'));

    expect(callback.mock.calls.map(([user]) => user?.id ?? null)).toEqual([
      null,
      'u1',
    ]);
  });

  it('loads the client when another tab signs in', async () => {
    onAuthReady(vi.fn());
    await settle();

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        newValue: '{}',
      }),
    );

    expect(getSupabase).toHaveBeenCalledOnce();
  });
});
