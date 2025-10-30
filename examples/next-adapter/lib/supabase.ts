import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  if (process.env.INGEST_SUPABASE !== 'true') return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadBuffer(
  supabase: ReturnType<typeof createClient>,
  path: string,
  data: ArrayBuffer,
  contentType: string
) {
  const bucket = process.env.SUPABASE_BUCKET_FILES || 'files';
  const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(data), {
    contentType,
    upsert: true,
  });
  if (error) throw error;
}
