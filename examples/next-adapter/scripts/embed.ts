#!/usr/bin/env node
import process from 'node:process';
import { indexKnowledge } from '../lib/knowledge/indexer';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.get('slug');
  const knowledgeId = args.get('knowledge_id') || args.get('knowledgeId');
  if (!slug && !knowledgeId) {
    throw new Error('Usage: node scripts/embed.ts --slug=<slug> or --knowledge_id=<uuid>');
  }

  const result = await indexKnowledge({ slug: slug || undefined, knowledgeId: knowledgeId || undefined, source: 'cli/embed' });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

function parseArgs(argv: string[]) {
  const map = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const idx = arg.indexOf('=');
    if (idx === -1) {
      map.set(arg.slice(2), 'true');
    } else {
      const key = arg.slice(2, idx);
      const value = arg.slice(idx + 1);
      map.set(key, value);
    }
  }
  return map;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
