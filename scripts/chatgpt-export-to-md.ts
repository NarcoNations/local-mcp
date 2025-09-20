#!/usr/bin/env ts-node
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const outDirDefault = path.join(process.cwd(), "docs", "chatgpt-export-md");

const toISO = (value?: number) => {
  if (!value) return new Date().toISOString();
  const ms = value > 2e10 ? value : value * 1000;
  return new Date(ms).toISOString();
};

const slug = (input: string) =>
  (input || "untitled")
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^a-z0-9\-]+/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80) || "untitled";

type AnyMessage = any;
type AnyConversation = any;

function asText(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const fragments = content
      .map((part) => part?.text?.value ?? part?.string_value ?? "")
      .filter(Boolean);
    if (fragments.length) return fragments.join("\n\n");
  }
  if (content?.parts && Array.isArray(content.parts)) {
    return content.parts.join("\n\n");
  }
  return JSON.stringify(content, null, 2);
}

function extractMessages(conversation: AnyConversation) {
  if (Array.isArray(conversation?.messages)) {
    return conversation.messages
      .map((message: AnyMessage) => ({
        role: message?.author?.role || message?.role || "unknown",
        text: asText(message?.content ?? message?.text),
        ts: message?.create_time ?? message?.timestamp ?? message?.create_time_ms
      }))
      .filter((message: AnyMessage) => message.text?.trim());
  }
  if (conversation?.mapping && typeof conversation.mapping === "object") {
    return Object.values(conversation.mapping)
      .map((node: any) => node?.message)
      .filter(Boolean)
      .map((message: AnyMessage) => ({
        role: message?.author?.role || message?.role || "unknown",
        text: asText(message?.content),
        ts: message?.create_time ?? message?.timestamp ?? message?.create_time_ms
      }))
      .filter((message: AnyMessage) => message.text?.trim())
      .sort((a: AnyMessage, b: AnyMessage) => (a.ts ?? 0) - (b.ts ?? 0));
  }
  if (conversation?.conversation?.messages) {
    return extractMessages(conversation.conversation);
  }
  return [];
}

async function loadExportJson(root: string) {
  const candidates = [
    path.join(root, "conversations.json"),
    path.join(root, "conversations", "conversations.json"),
    path.join(root, "export.json")
  ];
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      console.log(JSON.stringify({ level: "info", msg: "using_export_json", meta: { path: candidate } }));
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  throw new Error(`Could not find conversations.json in ${root}`);
}

async function ensureDir(target: string) {
  await fs.mkdir(target, { recursive: true });
}

async function main() {
  const argSeparator = process.argv.indexOf("--");
  const exportRoot = process.argv[argSeparator >= 0 ? argSeparator + 1 : 2];
  const outDirArg = process.argv[argSeparator >= 0 ? argSeparator + 2 : 3];
  if (!exportRoot) {
    console.error("Usage: npm run chatgpt:to-md -- /path/to/export [outDir]");
    process.exit(1);
  }
  const data = await loadExportJson(exportRoot);
  const conversations: AnyConversation[] = Array.isArray(data) ? data : data?.conversations ?? [];
  if (!Array.isArray(conversations) || conversations.length === 0) {
    console.error("No conversations found in export");
    process.exit(1);
  }
  const outDir = outDirArg || outDirDefault;
  await ensureDir(outDir);
  let written = 0;
  for (const conversation of conversations) {
    const id: string =
      conversation.id || conversation.conversation_id || crypto.randomBytes(6).toString("hex");
    const title: string = (conversation.title || conversation.gist || "Untitled").trim();
    const created =
      conversation.create_time || conversation.create_time_unix || conversation.create_time_ms || Date.now();
    const model: string = conversation.model_slug || conversation.model || "";
    const messages = extractMessages(conversation);
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
      ""
    ].join("\n");
    const body = messages
      .map((message: AnyMessage) => {
        const role = message.role === "system" ? "system" : message.role?.replace(/^assistant$/, "assistant").replace(/^user$/, "user");
        const when = message.ts ? toISO(message.ts) : "";
        const text = (message.text || "").normalize("NFKC").trim();
        return `## ${role}${when ? ` • ${when}` : ""}\n\n${text}\n`;
      })
      .join("\n");
    const filename = `${slug(title)}-${id.slice(0, 8)}.md`;
    await fs.writeFile(path.join(outDir, filename), `${header}${body}`, "utf8");
    written += 1;
  }
  console.log(
    JSON.stringify({
      level: "info",
      msg: "chatgpt_export_converted",
      meta: { conversations: conversations.length, filesWritten: written, outDir }
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
