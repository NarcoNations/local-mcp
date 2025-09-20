declare module "pdf-parse/lib/pdf-parse.js" {
  import { Buffer } from "buffer";
  function pdfParse(data: Buffer, options?: Record<string, unknown>): Promise<any>;
  export default pdfParse;
}
