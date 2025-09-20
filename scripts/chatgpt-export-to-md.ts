// scripts/chatgpt-export-to-md.ts
// Usage: npm run chatgpt:to-md -- /path/to/ChatGPT-export [outDir]
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

type AnyMsg = any;
type AnyConv = any;

const outDirDefault = path.join(process.cwd(), "docs", "chatgpt-export-md");
const toISO = (n?: number) => (n ? new Date(n > 2e10 ? n : n * 1000).toISOString() : new Date().toISOString());

const slug = (s: string) =>
  (s || "untitled")
    .toLowerCase()
    .replace(/[^\w\-]+/g, "-")
    .replace(/\-+/g, "-")
    .replace(/(^\-|\-$)/g, "")
    .slice(0, 80) || "untitled";

function asText(content: any): string {
  if (!content) return "";
  if (Array.isArray(content)) {
    const parts = content.map((c: any) => c?.text?.value ?? c?.string_value ?? "").filter(Boolean);
    if (parts.length) return parts.join("\n\n");
  }
  if (content?.parts && Array.isArray(content.parts)) return content.parts.join("\n\n");
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
}

function extractMessages(conv: AnyConv): { role: string; text: string; ts?: number }[] {
  if (Array.isArray(conv?.messages)) {
    return conv.messages
      .map((m: AnyMsg) => ({
        role: m?.author?.role || m?.role || "unknown",
        text: asText(m?.content || m?.text),
        ts: m?.create_time || m?.timestamp || m?.create_time_ms,
      }))
      .filter((m) => m.text?.trim());
  }
  if (conv?.mapping && typeof conv.mapping === "object") {
    const msgs = Object.values(conv.mapping)
      .map((n: any) => n?.message)
      .filter(Boolean)
      .map((m: any) => ({
        role: m?.author?.role || m?.role || "unknown",
        text: asText(m?.content),
        ts: m?.create_time || m?.timestamp || m?.create_time_ms,
      }))
      .filter((m) => m.text?.trim());
    return msgs.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  }
  if (conv?.conversation?.messages) return extractMessages(conv.conversation);
  return [];
}

async function loadExportJson(exportRoot: string): Promise<any> {
  const candidates = [
    path.join(exportRoot, "conversations.json"),
    path.join(exportRoot, "conversations", "conversations.json"),
    path.join(exportRoot, "export.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      console.log(JSON.stringify({ level: "info", msg: "using_export_json", meta: { path: p } }));
      return JSON.parse(raw);
    } catch {}
  }
  throw new Error(`Could not find conversations.json in ${exportRoot}`);
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const argIdx = process.argv.findIndex((a) => a === "--");
  const exportRoot = process.argv[argIdx >= 0 ? argIdx + 1 : 2] as string | undefined;
  const outDirArg = process.argv[argIdx >= 0 ? argIdx + 2 : 3] as string | undefined;
  if (!exportRoot) {
    console.error("Usage: npm run chatgpt:to-md -- /path/to/ChatGPT-export [outDir]");
    process.exit(1);
  }
  const data = await loadExportJson(exportRoot);
  const conversations: AnyConv[] = Array.isArray(data) ? data : data.conversations ?? [];
  if (!Array.isArray(conversations) || conversations.length === 0) {
    console.error("No conversations found in export.");
    process.exit(1);
  }

  const outDir = outDirArg || outDirDefault;
  await ensureDir(outDir);

  let written = 0;
  for (const conv of conversations) {
    const id: string = conv.id || conv.conversation_id || crypto.randomBytes(6).toString("hex");
    const title: string = (conv.title || conv.gist || "Untitled").trim();
    const created: number = conv.create_time || conv.create_time_unix || conv.create_time_ms || Date.now();
    const model: string = conv.model_slug || conv.model || "";
    const msgs = extractMessages(conv);

    const header = [
      "---",
      `id: ${JSON.stringify(id)}`,
      `title: ${JSON.stringify(title)}`,
      `created: ${JSON.stringify(toISO(created))}`,
      `model: ${JSON.stringify(model)}`,
      'source: "chatgpt-export"',
      "---",
      "",
      `# ${title}`,
      "",
    ].join("\n");

    const body = msgs
      .map((m) => {
        const role = m.role === "system" ? "system" : m.role?.replace(/^assistant$/, "assistant").replace(/^user$/, "user");
        const when = m.ts ? toISO(m.ts) : "";
        const text = (m.text || "").normalize("NFKC").trim();
        return `## ${role}${when ? ` • ${when}` : ""}\n\n${text}\n`;
      })
      .join("\n");

    const fname = `${slug(title)}-${id.slice(0, 8)}.md`;
    await fs.writeFile(path.join(outDir, fname), `${header}${body}`, "utf8");
    written++;
  }

  console.log(JSON.stringify({ level: "info", msg: "chatgpt_export_converted", meta: { conversations: conversations.length, filesWritten: written, outDir } }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
