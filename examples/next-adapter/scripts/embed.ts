#!/usr/bin/env node
import process from 'node:process';
import { runEmbeddingJob } from '../lib/embeddings/indexer';
import { logEvent } from '../lib/historian';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const opts: { knowledgeId?: string; slug?: string } = {};
  if (args['knowledge_id']) opts.knowledgeId = String(args['knowledge_id']);
  if (args['slug']) opts.slug = String(args['slug']);
  try {
    const started = Date.now();
    const result = await runEmbeddingJob(opts);
    const durationMs = Date.now() - started;
    await logEvent({
      source: 'embeddings',
      kind: 'knowledge.index',
      title: `Indexed ${result.slug}`,
      meta: { knowledgeId: result.knowledgeId, chunks: result.chunks.length, durationMs }
    });
    console.log(JSON.stringify({ ok: true, ...result, durationMs }, null, 2));
  } catch (err: any) {
    await logEvent({
      source: 'embeddings',
      kind: 'error',
      title: 'Embedding job failed',
      body: err?.message || String(err)
    });
    console.error(err);
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]) {
  const acc: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const trimmed = arg.slice(2);
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      acc[trimmed] = true;
    } else {
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      acc[key] = value;
    }
  }
  return acc;
}

main();
