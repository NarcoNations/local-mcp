#!/usr/bin/env node
import "source-map-support/register";
import { env } from "./config/env.js";
import { importPaths } from "./services/import-service.js";
import { indexPendingDocuments } from "./services/index-service.js";
import { searchCorpus } from "./services/search-service.js";
import { listSources, getDocumentDetail } from "./services/document-service.js";
import { closeDb } from "./db/index.js";
import { logger } from "./utils/logger.js";

interface ParsedArgs {
  command: string | undefined;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let command: string | undefined;
  const iter = argv[Symbol.iterator]();
  let current = iter.next();
  while (!current.done) {
    const token = current.value;
    if (!command) {
      command = token;
      current = iter.next();
      continue;
    }
    if (token.startsWith("--")) {
      const [rawKey, rawValue] = token.slice(2).split("=", 2);
      const key = rawKey.replace(/-/g, "_");
      if (rawValue !== undefined) {
        flags[key] = rawValue;
        current = iter.next();
        continue;
      }
      const nextToken = iter.next();
      if (!nextToken.done && !nextToken.value.startsWith("--")) {
        flags[key] = nextToken.value;
        current = iter.next();
        continue;
      }
      flags[key] = true;
      current = nextToken.done ? nextToken : iter.next();
      continue;
    }
    positional.push(token);
    current = iter.next();
  }
  return { command, positional, flags };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "import": {
      if (args.positional.length === 0) {
        console.error("Usage: mcp import <path> [path...]\n");
        process.exitCode = 1;
        break;
      }
      const summary = await importPaths(args.positional);
      const indexSummary = await indexPendingDocuments();
      console.log(JSON.stringify({ import: summary, index: indexSummary }, null, 2));
      break;
    }
    case "index": {
      const limitFlag = args.flags.limit ?? args.flags.l;
      const limit = typeof limitFlag === "string" ? Number(limitFlag) : undefined;
      const summary = await indexPendingDocuments(limit);
      console.log(JSON.stringify(summary, null, 2));
      break;
    }
    case "search": {
      const query = args.positional.join(" ");
      if (!query) {
        console.error("Usage: mcp search \"query\" [--k 8 --author name --tag topic]\n");
        process.exitCode = 1;
        break;
      }
      const filters = {
        author: typeof args.flags.author === "string" ? args.flags.author : undefined,
        contentType: typeof args.flags.content_type === "string" ? args.flags.content_type : undefined,
        slug: typeof args.flags.slug === "string" ? args.flags.slug : undefined,
        tag: typeof args.flags.tag === "string" ? args.flags.tag : undefined,
        dateFrom:
          typeof args.flags.date_from === "string" ? new Date(args.flags.date_from) : undefined,
        dateTo: typeof args.flags.date_to === "string" ? new Date(args.flags.date_to) : undefined,
      };
      const topK = typeof args.flags.k === "string" ? Number(args.flags.k) : undefined;
      const result = await searchCorpus(query, topK ?? env.RESULTS_TOPK, filters);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "sources": {
      const kind = typeof args.flags.kind === "string" ? args.flags.kind : undefined;
      const sources = await listSources(kind as any);
      console.log(JSON.stringify({ sources }, null, 2));
      break;
    }
    case "doc": {
      const docId = args.positional[0];
      if (!docId) {
        console.error("Usage: mcp doc <document_id>\n");
        process.exitCode = 1;
        break;
      }
      const detail = await getDocumentDetail(docId);
      if (!detail) {
        console.error(`Document ${docId} not found`);
        process.exitCode = 1;
        break;
      }
      console.log(JSON.stringify(detail, null, 2));
      break;
    }
    default: {
      console.error(
        "Usage: mcp <command>\nCommands: import, index, search, sources, doc\n"
      );
      process.exitCode = 1;
    }
  }
}

run()
  .catch((error) => {
    logger.error("cli-error", { err: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
