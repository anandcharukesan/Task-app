import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration provided by user or environment
const supabaseUrl: string =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  '';

const supabaseAnonKey: string =
  (typeof process !== 'undefined' &&
    (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  '';

// Check if valid credentials are provided
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'USER_WILL_ADD_URL' &&
    supabaseAnonKey !== 'USER_WILL_ADD_KEY' &&
    supabaseUrl.startsWith('http')
  );
};

// Singleton client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    })
  : null;
