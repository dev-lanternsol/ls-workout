import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for backend (with full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);