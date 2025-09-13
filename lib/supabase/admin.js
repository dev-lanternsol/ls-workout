import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;           // URL can be public
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;        // server-only
  if (!url || !serviceKey) throw new Error('Missing SUPABASE envs for admin client');
  return createClient(url, serviceKey);
}
