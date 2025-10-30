import { createClient } from '@supabase/supabase-js';

export function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase admin env vars');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
