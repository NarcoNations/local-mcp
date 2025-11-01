import { NextResponse } from 'next/server';
import { getNamespace, getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const namespace = getNamespace();
    const url = new URL(request.url);
    const summary = url.searchParams.get('summary');

    const { data, error } = await supabase
      .from('knowledge_manifests')
      .select('manifest, updated_at')
      .eq('namespace', namespace)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ namespace, manifest: null });
    }

    const manifest = data.manifest ?? {};

    if (summary) {
      const files = manifest?.files ? Object.keys(manifest.files).length : 0;
      return NextResponse.json({
        namespace,
        files,
        chunks: manifest?.chunks ?? 0,
        embeddings: manifest?.embeddingsCached ?? 0,
        lastIndexedAt: manifest?.lastIndexedAt ?? null,
        updatedAt: data.updated_at,
      });
    }

    return NextResponse.json({ namespace, manifest, updatedAt: data.updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
