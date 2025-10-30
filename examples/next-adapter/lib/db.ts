import type { SupabaseClient } from '@supabase/supabase-js';

export type KnowledgeRow = {
  slug: string;
  title?: string | null;
  manifest_path?: string | null;
  tags?: string[] | null;
  sha256?: string | null;
  meta?: any;
};

export async function upsertKnowledge(
  supabase: SupabaseClient<any, 'public', any>,
  row: KnowledgeRow
) {
  const { error } = await supabase
    .from('knowledge')
    .upsert(row as any, { onConflict: 'slug' });
  if (error) throw error;
}
