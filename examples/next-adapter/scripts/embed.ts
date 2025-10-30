#!/usr/bin/env node
import { indexKnowledgeById, indexKnowledgeBySlug } from '../lib/knowledge/indexer';

async function main() {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [key, value = ''] = arg.split('=');
    if (key.startsWith('--')) args.set(key.slice(2), value);
  }
  const slug = args.get('slug');
  const knowledgeId = args.get('knowledge_id');
  if (!slug && !knowledgeId) {
    console.error('Usage: node scripts/embed.ts --slug=<slug> | --knowledge_id=<uuid>');
    process.exit(1);
  }
  const start = Date.now();
  const result = slug ? await indexKnowledgeBySlug(slug) : await indexKnowledgeById(knowledgeId!);
  const elapsed = Date.now() - start;
  console.log(`Indexed knowledge ${result.slug} (${result.knowledgeId}) -> ${result.chunks} chunks in ${elapsed}ms`);
}

main().catch((err) => {
  console.error('Embedding job failed:', err?.message || err);
  process.exit(1);
});
