import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { sbServer } from '@/lib/supabase/server';

export async function processChatExportFromUrl(fileUrl: string) {
  const tmp = path.join(os.tmpdir(), 'chat-export-' + Date.now() + '.json');
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('download failed: ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(tmp, buf);
  const r = await processChatExportFromPath(tmp);
  try { await fs.promises.unlink(tmp); } catch {}
  return r;
}

export async function processChatExportFromPath(filePath: string) {
  const sb = sbServer();
  let convCount = 0;
  let msgCount = 0;
  const convBatch: any[] = [];
  const msgBatch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    const pipeline: any = chain([
      fs.createReadStream(filePath),
      parser(),
      streamArray()
    ]);

    pipeline.on('data', async (data: any) => {
      const conv = data.value;
      const convId = conv.id || conv.conversation_id || 'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      convBatch.push({ id: convId, title: conv.title || null, created_at: conv.create_time ? new Date(conv.create_time).toISOString() : null, updated_at: conv.update_time ? new Date(conv.update_time).toISOString() : null, source: 'chatgpt_export', meta: conv.metadata || {} });
      convCount++;
      const mapping = conv.mapping || {};
      for (const key of Object.keys(mapping)) {
        const node = mapping[key];
        if (!node || !node.message) continue;
        const m = node.message;
        const parts = Array.isArray(m?.content?.parts) ? m.content.parts.filter((p: any) => typeof p === 'string') : [];
        const text = parts.join('

');
        const id = m.id || key;
        msgBatch.push({ id, conversation_id: convId, author: (m.author && (m.author.name || m.author.role)) || null, role: (m.author && m.author.role) || null, model: m.metadata?.model_slug || m.metadata?.model || null, created_at: m.create_time ? new Date(m.create_time * 1000).toISOString() : null, text, meta: m.metadata || {} });
        msgCount++;
      }

      if (convBatch.length >= 200) {
        // flush in chunks
        await sb.from('conversations').upsert(convBatch, { onConflict: 'id' });
        convBatch.length = 0;
      }
      if (msgBatch.length >= 500) {
        await sb.from('messages').upsert(msgBatch, { onConflict: 'id' });
        msgBatch.length = 0;
      }
    });

    pipeline.on('end', async () => {
      try {
        if (convBatch.length) await sb.from('conversations').upsert(convBatch, { onConflict: 'id' });
        if (msgBatch.length) await sb.from('messages').upsert(msgBatch, { onConflict: 'id' });
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    pipeline.on('error', (e: any) => reject(e));
  });

  return { conversations: convCount, messages: msgCount };
}
