declare module "pdf-parse" {
  interface PDFOptions {
    pagerender?: (pageData: any) => Promise<string> | string;
    disableCombineTextItems?: boolean;
    disableFontFace?: boolean;
  }
  interface PDFData {
    text: string;
    numpages: number;
  }
  function pdfParse(data: Buffer | Uint8Array, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}
