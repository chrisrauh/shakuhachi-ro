import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

// Use globalThis to avoid TDZ (temporal dead zone) issues with vi.mock hoisting
declare global {
  var __testAuthCallback:
    | ((user: User | null, session: Session | null, event: string) => void)
    | null;
}

globalThis.__testAuthCallback = null;

vi.mock('./auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    user: null,
    error: null,
  }),
  onAuthStateChange: vi.fn((cb) => {
    globalThis.__testAuthCallback = cb;
    return { unsubscribe: vi.fn() };
  }),
}));

import { AuthStateManager } from './authState';

describe('AuthStateManager - FIXED IMPLEMENTATION', () => {
  beforeEach(async () => {
    (AuthStateManager as any).instance = null;
    globalThis.__testAuthCallback = null;
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  afterEach(async () => {
    (AuthStateManager as any).instance = null;
    globalThis.__testAuthCallback = null;
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('subscribe() fires immediately (fixed)', () => {
    it('subscribe() fires immediately with current auth state', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const callback = vi.fn();
      manager.subscribe(callback);

      // FIXED: Should fire immediately (1 call)
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, null);
    });

    it('subscribe() fires immediately with user from initialization', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock getCurrentUser to return a user
      const { getCurrentUser } = await vi.importMock('./auth');
      (getCurrentUser as any).mockResolvedValueOnce({
        user: mockUser,
        error: null,
      });

      // Need to reset instance to test new initialization
      (AuthStateManager as any).instance = null;

      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const callback = vi.fn();
      manager.subscribe(callback);

      // FIXED: Fires immediately with the user
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(mockUser, null);
    });
  });

  describe('INITIAL_SESSION does NOT cause duplicate (fixed)', () => {
    it('INITIAL_SESSION does not fire callback if user unchanged', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const callback = vi.fn();
      manager.subscribe(callback);

      // Already 1 call from subscribe() firing immediately
      expect(callback).toHaveBeenCalledTimes(1);
      callback.mockClear();

      // Simulate INITIAL_SESSION with same user (null to null)
      if (globalThis.__testAuthCallback) {
        globalThis.__testAuthCallback(null, null, 'INITIAL_SESSION');
      }

      // FIXED: No additional call (user didn't change)
      expect(callback).not.toHaveBeenCalled();
    });

    it('Other events still notify (TOKEN_REFRESHED, etc)', async () => {
      const mockUser: User = {
        id: 'user-789',
        email: 'user2@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const callback = vi.fn();
      manager.subscribe(callback);

      // 1 call from subscribe()
      expect(callback).toHaveBeenCalledTimes(1);
      callback.mockClear();

      // Simulate SIGNED_IN event
      if (globalThis.__testAuthCallback) {
        globalThis.__testAuthCallback(
          mockUser,
          { user: mockUser } as Session,
          'SIGNED_IN',
        );
      }

      // Should notify (user changed)
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(mockUser, { user: mockUser });
    });
  });

  describe('Multiple subscribers', () => {
    it('all subscribers fire immediately', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const cb3 = vi.fn();

      manager.subscribe(cb1);
      manager.subscribe(cb2);
      manager.subscribe(cb3);

      // All fired immediately
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb3).toHaveBeenCalledTimes(1);
    });

    it('no duplicate calls on INITIAL_SESSION', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      manager.subscribe(cb1);
      manager.subscribe(cb2);

      // Both at 1 (from immediate subscribe)
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);

      cb1.mockClear();
      cb2.mockClear();

      // Simulate INITIAL_SESSION (user null to null, no change)
      if (globalThis.__testAuthCallback) {
        globalThis.__testAuthCallback(null, null, 'INITIAL_SESSION');
      }

      // No additional calls
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  describe('State management', () => {
    it('getUser() returns current state', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(manager.getUser()).toBeNull();
    });

    it('isAuthenticated() reflects state', async () => {
      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(manager.isAuthenticated()).toBe(false);
    });
  });

  describe('Unsubscribe', () => {
    it('unsubscribe removes listener', async () => {
      const mockUser: User = {
        id: 'user-999',
        email: 'unsubtest@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      const manager = AuthStateManager.getInstance();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      // 1 call from subscribe()
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      callback.mockClear();

      // Simulate auth change
      if (globalThis.__testAuthCallback) {
        globalThis.__testAuthCallback(
          mockUser,
          { user: mockUser } as Session,
          'SIGNED_IN',
        );
      }

      // Not called (unsubscribed)
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
