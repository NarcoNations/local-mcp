import fs from 'node:fs';
import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { sbServer } from '../supabase/server';

export type ChatIngestResult = { conversations: number; messages: number };

export async function processChatExportFromUrl(fileUrl: string): Promise<ChatIngestResult> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('download failed: ' + res.status);
  if (!res.body) throw new Error('download missing body');
  const nodeStream = Readable.fromWeb(res.body as any);
  return processChatExportFromStream(nodeStream);
}

export async function processChatExportFromPath(filePath: string): Promise<ChatIngestResult> {
  return processChatExportFromStream(fs.createReadStream(filePath));
}

export async function processChatExportFromStream(stream: NodeJS.ReadableStream): Promise<ChatIngestResult> {
  const sb = sbServer();
  let convCount = 0;
  let msgCount = 0;
  const convBatch: any[] = [];
  const msgBatch: any[] = [];

  async function flush() {
    if (convBatch.length) {
      await sb.from('conversations').upsert(convBatch.splice(0, convBatch.length), { onConflict: 'id' });
    }
    if (msgBatch.length) {
      await sb.from('messages').upsert(msgBatch.splice(0, msgBatch.length), { onConflict: 'id' });
    }
  }

  const pipeline: any = chain([stream, parser(), streamArray()]);

  for await (const data of pipeline) {
    const conv = data?.value || {};
    const convId = conv.id || conv.conversation_id || `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    convBatch.push({
      id: convId,
      title: conv.title || null,
      created_at: toIso(conv.create_time),
      updated_at: toIso(conv.update_time),
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
      const id = message.id || key;
      msgBatch.push({
        id,
        conversation_id: convId,
        author: (message.author && (message.author.name || message.author.role)) || null,
        role: (message.author && message.author.role) || null,
        model: message.metadata?.model_slug || message.metadata?.model || null,
        created_at: toIso(message.create_time),
        text,
        meta: message.metadata || {}
      });
      msgCount++;
    }

    if (convBatch.length >= 200) await flush();
    if (msgBatch.length >= 500) await flush();
  }

  await flush();
  return { conversations: convCount, messages: msgCount };
}

function toIso(value: any) {
  if (value === null || value === undefined || value === '') return null;
  try {
    if (typeof value === 'number') {
      const ms = value > 1e12 ? value : value * 1000;
      return new Date(ms).toISOString();
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const asNum = Number(value);
      if (!Number.isNaN(asNum) && value.length <= 12) {
        const ms = asNum > 1e12 ? asNum : asNum * 1000;
        return new Date(ms).toISOString();
      }
      return new Date(value).toISOString();
    }
  } catch {}
  return null;
}
