import { createClient } from '@supabase/supabase-js';
import { SESSION_STORAGE_KEY, supabaseAnonKey, supabaseUrl } from './supabase';

/**
 * The client itself. Import it through getSupabase(), which loads this module
 * on first use. A page that always needs it, such as the library, imports this
 * module directly so supabase-js downloads with the page.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: SESSION_STORAGE_KEY },
});
