import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import type { Section } from "../../importers/types.js";

function sectionsDir(): string {
  return path.resolve(process.cwd(), env.DATA_ROOT, "sections");
}

export async function writeSections(documentId: string, sections: Section[]): Promise<string> {
  const dir = sectionsDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${documentId}.json`);
  await fs.writeFile(filePath, JSON.stringify(sections));
  return filePath;
}

export async function readSections(documentId: string): Promise<Section[] | null> {
  const filePath = path.join(sectionsDir(), `${documentId}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as Section[];
  } catch (error: any) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function deleteSections(documentId: string): Promise<void> {
  const filePath = path.join(sectionsDir(), `${documentId}.json`);
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
}
