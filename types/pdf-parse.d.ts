declare module "pdf-parse" {
  interface PdfPage {
    getTextContent(options?: { normalizeWhitespace?: boolean }): Promise<{ items: Array<{ str?: string }> }>;
  }

  interface PdfParseOptions {
    pagerender?: (page: PdfPage) => Promise<string> | string;
  }

  function pdfParse(data: Uint8Array | ArrayBuffer | Buffer, options?: PdfParseOptions): Promise<{ text: string }>;
  export = pdfParse;
}
