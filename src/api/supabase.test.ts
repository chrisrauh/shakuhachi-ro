import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('SESSION_STORAGE_KEY', () => {
  // auth.ts reads it to tell a signed-out visitor without loading supabase-js.
  // If it drifts from the library's default, signed-in users look signed out.
  it("matches the key supabase-js stores a hosted project's session under", async () => {
    const url = 'https://abcdefghijklmnop.supabase.co';
    vi.stubEnv('VITE_SUPABASE_URL', url);
    vi.resetModules();
    const { SESSION_STORAGE_KEY } = await import('./supabase');

    const client = createClient(url, 'anon-key');

    expect(SESSION_STORAGE_KEY).toBe(
      (client as unknown as { storageKey: string }).storageKey,
    );
    vi.unstubAllEnvs();
  });
});
