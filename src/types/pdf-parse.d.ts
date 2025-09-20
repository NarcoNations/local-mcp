declare module "pdf-parse/lib/pdf-parse.js" {
  import type { PDFDocumentProxy } from "pdfjs-dist";
  type Pagerender = (pageData: any) => Promise<string>;
  interface Options {
    pagerender?: Pagerender;
    max?: number;
    version?: string;
  }
  function pdf(data: Buffer, options?: Options): Promise<{ text: string }>;
  export default pdf;
}
