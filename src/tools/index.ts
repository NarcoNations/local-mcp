import { z } from "zod";
import { Store } from "../store/store.js";
import { createGetDocTool } from "./getDoc.js";
import { createImportChatGPTTool } from "./importChatGPT.js";
import { createReindexTool } from "./reindex.js";
import { createSearchLocalTool } from "./searchLocal.js";
import { createStatsTool } from "./stats.js";
import { createWatchTool } from "./watch.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny | null;
  jsonSchema: Record<string, unknown>;
  handler: (input: unknown) => Promise<unknown>;
}

type EventEmitter = (event: Record<string, unknown>) => void;

export function createTools(store: Store, emit: EventEmitter): ToolDefinition[] {
  return [
    createSearchLocalTool(store),
    createGetDocTool(store),
    createReindexTool(store),
    createWatchTool(store, emit),
    createStatsTool(store),
    createImportChatGPTTool(store, emit)
  ];
}
