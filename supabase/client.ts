import { createClient } from '@supabase/supabase-js';
import type { SupabaseSettings } from './env.js';
import { readSupabaseSettings } from './env.js';

type ServiceClient = ReturnType<typeof createClient>;

let cachedClient: ServiceClient | null = null;
let cachedSettings: SupabaseSettings | null = null;

export function getServiceClient(settings?: SupabaseSettings): ServiceClient {
  const resolved = settings ?? readSupabaseSettings();
  if (!resolved) {
    throw new Error('Supabase service credentials are not configured');
  }
  if (cachedClient && cachedSettings && cachedSettings.url === resolved.url && cachedSettings.serviceRoleKey === resolved.serviceRoleKey && cachedSettings.schema === resolved.schema) {
    return cachedClient;
  }
  cachedSettings = resolved;
  cachedClient = createClient(resolved.url, resolved.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: resolved.schema } as any,
    global: { headers: { 'x-client-info': 'local-mcp/knowledge-store' } },
  });
  return cachedClient!;
}
