import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { sbServer } from '@/examples/next-adapter/lib/supabase/server';

type ExtractedMessage = {
  id: string;
  author: string | null;
  role: string | null;
  model: string | null;
  created_at: string | null;
  text: string;
  meta: any;
};

export async function processChatExportFromUrl(fileUrl: string) {
  if (fileUrl.startsWith('file://')) {
    return processChatExportFromPath(fileUrl.slice('file://'.length));
  }
  if (!/^[a-zA-Z]+:/.test(fileUrl)) {
    return processChatExportFromPath(fileUrl);
  }
  const tmp = path.join(os.tmpdir(), 'chat-export-' + Date.now() + '.json');
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('download failed: ' + res.status);
  if (!res.body) throw new Error('download response missing body');
  const fileStream = fs.createWriteStream(tmp);
  const readable = Readable.fromWeb(res.body as any);
  await streamPipeline(readable, fileStream);
  const r = await processChatExportFromPath(tmp);
  try {
    await fs.promises.unlink(tmp);
  } catch {}
  return r;
}

export async function processChatExportFromPath(filePath: string) {
  const sb = sbServer();
  let convCount = 0;
  let msgCount = 0;
  const convBatch: any[] = [];
  const msgBatch: any[] = [];

  const flushBatches = async () => {
    if (convBatch.length) {
      await sb.from('conversations').upsert(convBatch.splice(0, convBatch.length), { onConflict: 'id' });
    }
    if (msgBatch.length) {
      await sb.from('messages').upsert(msgBatch.splice(0, msgBatch.length), { onConflict: 'id' });
    }
  };

  await new Promise<void>((resolve, reject) => {
    const pipelineStream: any = chain([
      fs.createReadStream(filePath),
      parser(),
      streamArray()
    ]);

    pipelineStream.on('data', async (data: any) => {
      pipelineStream.pause();
      try {
        const conv = data.value || {};
        const convId = String(
          conv.id ||
            conv.conversation_id ||
            'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2)
        );
        convBatch.push({
          id: convId,
          title: conv.title || null,
          created_at: normalizeTimestamp(conv.create_time),
          updated_at: normalizeTimestamp(conv.update_time),
          source: 'chatgpt_export',
          meta: conv.metadata || {}
        });
        convCount++;

        const messages = extractMessages(conv);
        for (const message of messages) {
          msgBatch.push({
            id: message.id,
            conversation_id: convId,
            author: message.author,
            role: message.role,
            model: message.model,
            created_at: message.created_at,
            text: message.text,
            meta: message.meta
          });
          msgCount++;
        }

        if (convBatch.length >= 200 || msgBatch.length >= 500) {
          await flushBatches();
        }
      } catch (err) {
        reject(err);
        return;
      } finally {
        pipelineStream.resume();
      }
    });

    pipelineStream.on('end', async () => {
      try {
        await flushBatches();
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    pipelineStream.on('error', (e: any) => reject(e));
  });

  return { conversations: convCount, messages: msgCount };
}

function extractMessages(conv: any): ExtractedMessage[] {
  const out: ExtractedMessage[] = [];
  const pushMessage = (msg: any, fallbackId: string) => {
    if (!msg) return;
    const id = String(msg.id || fallbackId || 'msg-' + Math.random().toString(36).slice(2));
    const parts = Array.isArray(msg?.content?.parts)
      ? msg.content.parts.filter((p: any) => typeof p === 'string')
      : [];
    const text = parts.join('\n\n') || (typeof msg?.content === 'string' ? msg.content : '');
    out.push({
      id,
      author: msg.author?.name || msg.author?.role || null,
      role: msg.author?.role || null,
      model: msg.metadata?.model_slug || msg.metadata?.model || conv.model_slug || null,
      created_at: normalizeTimestamp(msg.create_time, true),
      text,
      meta: msg.metadata || {}
    });
  };

  if (Array.isArray(conv.messages)) {
    for (const message of conv.messages) {
      pushMessage(message, message?.id || '');
    }
  } else if (conv.mapping && typeof conv.mapping === 'object') {
    for (const key of Object.keys(conv.mapping)) {
      const node = conv.mapping[key];
      if (node?.message) {
        pushMessage(node.message, key);
      }
    }
  }
  return out;
}

function normalizeTimestamp(value: any, seconds = false): string | null {
  if (!value && value !== 0) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const ms = seconds ? num * 1000 : num >= 1e12 ? num : num * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
