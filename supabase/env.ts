export interface SupabaseSettings {
  url: string;
  serviceRoleKey: string;
  schema: string;
  namespace: string;
}

export function readSupabaseSettings(): SupabaseSettings | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceRoleKey) return null;
  const schema = process.env.SUPABASE_SCHEMA || 'public';
  const namespace = process.env.SUPABASE_KNOWLEDGE_NAMESPACE || 'default';
  return { url, serviceRoleKey, schema, namespace };
}

export function hasSupabaseConfig(): boolean {
  return readSupabaseSettings() !== null;
}
