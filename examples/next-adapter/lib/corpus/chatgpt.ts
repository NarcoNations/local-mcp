import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

export async function processChatExportFromUrl(fileUrl: string) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('download failed: ' + res.status);
  if (!res.body) throw new Error('download response missing body');
  const tmp = path.join(os.tmpdir(), `chat-export-${Date.now()}.json`);
  await streamPipeline(Readable.fromWeb(res.body as any), fs.createWriteStream(tmp));
  try {
    return await processChatExportFromPath(tmp);
  } finally {
    try {
      await fs.promises.unlink(tmp);
    } catch {}
  }
}

export async function processChatExportFromPath(filePath: string) {
  const shape = await detectShape(filePath);
  const source = fs.createReadStream(filePath);
  return processChatExportStream(source, shape);
}

async function processChatExportStream(source: NodeJS.ReadableStream, shape: 'object' | 'array') {
  const sb = sbServer();
  const convBatch: any[] = [];
  const msgBatch: any[] = [];
  let convCount = 0;
  let msgCount = 0;

  const pipeline =
    shape === 'object'
      ? (chain([
          source as any,
          parser() as any,
          pick({ filter: 'conversations' }) as any,
          streamArray() as any
        ]) as unknown as AsyncIterable<{ value: any }>)
      : (chain([source as any, parser() as any, streamArray() as any]) as unknown as AsyncIterable<{ value: any }>);

  for await (const data of pipeline) {
    const conv = data.value;
    if (!conv) continue;
    const convId = normalizeId(conv.id || conv.conversation_id, 'conv');
    convBatch.push({
      id: convId,
      title: conv.title || null,
      created_at: normalizeTime(conv.create_time),
      updated_at: normalizeTime(conv.update_time),
      source: 'chatgpt_export',
      meta: conv.metadata || {}
    });
    convCount++;

    const mapping = conv.mapping || {};
    for (const key of Object.keys(mapping)) {
      const node = mapping[key];
      if (!node || !node.message) continue;
      const message = node.message;
      const parts = Array.isArray(message?.content?.parts)
        ? message.content.parts.filter((p: any) => typeof p === 'string')
        : [];
      const text = parts.join('\n\n');
      const msgId = normalizeId(message.id || key, 'msg');
      msgBatch.push({
        id: msgId,
        conversation_id: convId,
        author: message.author?.name || message.author?.role || null,
        role: message.author?.role || null,
        model: message.metadata?.model_slug || message.metadata?.model || null,
        created_at: normalizeTime(message.create_time),
        text,
        meta: message.metadata || {}
      });
      msgCount++;
      if (msgBatch.length >= 500) {
        await flushMessages(sb, msgBatch);
      }
    }

    if (convBatch.length >= 200) {
      await flushConversations(sb, convBatch);
    }
  }

  await flushConversations(sb, convBatch);
  await flushMessages(sb, msgBatch);

  return { conversations: convCount, messages: msgCount };
}

async function flushConversations(sb: ReturnType<typeof sbServer>, batch: any[]) {
  if (!batch.length) return;
  await sb.from('conversations').upsert(batch, { onConflict: 'id' });
  batch.length = 0;
}

async function flushMessages(sb: ReturnType<typeof sbServer>, batch: any[]) {
  if (!batch.length) return;
  await sb.from('messages').upsert(batch, { onConflict: 'id' });
  batch.length = 0;
}

async function detectShape(filePath: string): Promise<'object' | 'array'> {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(1024);
    const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
    for (let i = 0; i < bytesRead; i++) {
      const ch = String.fromCharCode(buf[i]);
      if (/\s/.test(ch)) continue;
      if (ch === '[') return 'array';
      break;
    }
    return 'object';
  } finally {
    await handle.close();
  }
}

function normalizeId(id: any, prefix: string) {
  if (typeof id === 'string' && id.trim()) return id.trim();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTime(input: any) {
  if (input === null || input === undefined) return null;
  if (input instanceof Date) return input.toISOString();
  if (typeof input === 'number') {
    if (input > 1e12) return new Date(input).toISOString();
    return new Date(input * 1000).toISOString();
  }
  if (typeof input === 'string') {
    const numeric = Number(input);
    if (!Number.isNaN(numeric)) return normalizeTime(numeric);
    const dt = new Date(input);
    if (!Number.isNaN(dt.valueOf())) return dt.toISOString();
  }
  return null;
}
