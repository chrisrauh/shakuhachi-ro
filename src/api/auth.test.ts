import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { signIn, onAuthStateChange, onAuthReady } from './auth';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

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

describe('onAuthStateChange', () => {
  beforeEach(() => vi.clearAllMocks());

  it('relays each event with the user taken from the session', () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthStateChange(callback);

    const session = sessionFor('u1');
    emit('SIGNED_IN', session);
    emit('SIGNED_OUT', null);

    expect(callback.mock.calls).toEqual([
      [session.user, session, 'SIGNED_IN'],
      [null, null, 'SIGNED_OUT'],
    ]);
  });
});

describe('onAuthReady', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires once with the initial state, even when signed out', () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);

    emit('INITIAL_SESSION', null);

    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('ignores events that keep the same user, such as token refreshes', () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);

    emit('INITIAL_SESSION', sessionFor('u1'));
    emit('TOKEN_REFRESHED', sessionFor('u1'));
    emit('SIGNED_IN', sessionFor('u1'));

    expect(callback).toHaveBeenCalledOnce();
  });

  it('fires again when the user signs out, signs in or changes', () => {
    const { emit } = captureListener();
    const callback = vi.fn();
    onAuthReady(callback);

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
