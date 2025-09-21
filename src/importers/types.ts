import { sourceKindEnum } from "../db/index.js";

export type SourceKind = (typeof sourceKindEnum.enumValues)[number];

export interface ImportSource {
  kind: SourceKind;
  origin: string;
  grade?: "A" | "B" | "C";
}

export interface ImportDocumentMeta {
  title: string;
  pathOrUri: string;
  author?: string;
  contentType: string;
  slug?: string;
  routeHint?: string;
  heroImage?: string;
  meta: Record<string, unknown>;
  confidence?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Section {
  heading?: string;
  text: string;
  page?: number;
  order: number;
}

export interface ImportResult {
  source: ImportSource;
  document: ImportDocumentMeta;
  sections: Section[];
  contentHash: string;
}

export interface ImportContext {
  filePath: string;
  now: Date;
}

export interface Importer {
  canImport(context: ImportContext): Promise<boolean> | boolean;
  import(context: ImportContext): Promise<ImportResult[]>;
}
