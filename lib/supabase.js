import { createClient } from '@supabase/supabase-js';

// These read from environment variables so real credentials never get
// committed to GitHub — see .env.local.example for what to set up.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
