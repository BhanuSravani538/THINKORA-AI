import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env.js';

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ Supabase PostgreSQL client connected to:', env.SUPABASE_URL);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Supabase client:', error);
    supabaseClient = null;
  }
} else {
  console.log('ℹ️ Supabase credentials not set in server/.env — operating in resilient fallback mode.');
  console.log('👉 To enable Supabase cloud persistence: update SUPABASE_URL and SUPABASE_ANON_KEY in server/.env');
}

export const supabase = supabaseClient;
export { isSupabaseConfigured };
