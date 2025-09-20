import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";
import { AppConfig } from "../config.js";
import { getStore } from "../store/store.js";
import { ensureWithinRoots } from "../utils/fs-guard.js";
import { convertChatGPTExport } from "../utils/chatgpt.js";

export const ImportChatGPTShape = {
  exportPath: z.string().min(1),
  outDir: z.string().min(1).default("./docs/chatgpt-export-md"),
};

export const ImportChatGPTSchema = z.object(ImportChatGPTShape);

export function createImportChatGPTTool(config: AppConfig) {
  return async function importChatGPT(input: unknown) {
    const parsed = ImportChatGPTSchema.parse(input);
    const outDirAbs = path.resolve(parsed.outDir);
    if (!(await withinAllowed(config, outDirAbs))) {
      throw new Error(`outDir must be within configured roots: ${parsed.outDir}`);
    }
    await fs.mkdir(outDirAbs, { recursive: true });
    const conversion = await convertChatGPTExport(parsed.exportPath, outDirAbs);
    const store = await getStore(config);
    const stats = await store.reindex([outDirAbs]);
    return { filesWritten: conversion.filesWritten, outDir: outDirAbs, indexed: stats.indexed };
  };
}

async function withinAllowed(config: AppConfig, candidate: string): Promise<boolean> {
  try {
    await ensureWithinRoots(config.roots.roots, candidate).catch(async (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        const parent = path.dirname(candidate);
        await ensureWithinRoots(config.roots.roots, parent);
      } else {
        throw err;
      }
    });
    return true;
  } catch {
    return false;
  }
}
