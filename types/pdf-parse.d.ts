declare module "pdf-parse/lib/pdf-parse.js" {
  import type { PDFOptions } from "pdf-parse";
  function pdf(data: Buffer | Uint8Array, options?: PDFOptions): Promise<{
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }>;
  export = pdf;
}
