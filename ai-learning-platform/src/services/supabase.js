// Supabase initialization and configuration (alternative to Firebase)
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client only if config is available
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Helper function to get Supabase client
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }
  return supabase;
};

export default supabase;