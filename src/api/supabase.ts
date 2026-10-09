import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check .env file.',
  );
}

/**
 * Where supabase-js keeps the signed-in session in localStorage. This is the
 * library's own default, so changing it would sign everyone out.
 */
export const SESSION_STORAGE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

let client: Promise<SupabaseClient> | undefined;
let resolveLoaded: (client: SupabaseClient) => void;
const loaded = new Promise<SupabaseClient>((resolve) => {
  resolveLoaded = resolve;
});

/**
 * The Supabase client, loaded on first use. supabase-js is the largest script
 * on the site (~45 KB gzipped), and a signed-out visitor reading a score
 * never needs it, so no page downloads it until something calls this.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!client) {
    client = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: { storageKey: SESSION_STORAGE_KEY },
      }),
    );
    client.then(resolveLoaded);
  }
  return client;
}

/** Resolves once something has loaded the client, without loading it */
export function whenSupabaseLoaded(): Promise<SupabaseClient> {
  return loaded;
}
