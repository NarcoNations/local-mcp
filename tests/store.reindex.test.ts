import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

vi.mock("@xenova/transformers", () => ({
  pipeline: async () => async () => ({ data: new Float32Array([1, 0, 0, 0]) })
}));

import { loadConfig } from "../src/config.js";
import { Store, reindexPaths } from "../src/store/store.js";

const SAMPLE_FILES = {
  pdf: [
    "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgaHR0cDovL3d3dy5yZXBvcnRsYWIuY29tCjEgMCBvYmoKPDwKL0YxIDIg",
    "MCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlw",
    "ZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVu",
    "dCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3Rh",
    "dGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5",
    "cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjUwOTIwMDMzMzI1KzAwJzAw",
    "JykgL0NyZWF0b3IgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIHd3dy5yZXBvcnRsYWIuY29tKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNTA5MjAw",
    "MzMzMjUrMDAnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIHd3dy5yZXBvcnRsYWIuY29tKSAKICAvU3ViamVjdCAodW5zcGVjaWZp",
    "ZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKNiAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDMgMCBSIF0gL1R5cGUg",
    "L1BhZ2VzCj4+CmVuZG9iago3IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE4Ngo+PgpzdHJlYW0K",
    "R2FyPyg1bWtJXydMX1tZYEBUUC5tNFk9JFpAXylRamhGJlM7aSo+SnEyJV5eRG1ZQ1JiVjRxW28qQUotXWlJNCZiPzQwPVBfMG9PT1ZaayJHKzxzVHFUM2VO",
    "YjpmZCZAWzR1R0AjJW44S3RFSEpdJT4pSiMiKCRFPidVMmxZNFhhWj9iaFUiSiU7IUhMW2NYdUw2cys3Z2YsNF0/\"IjprTGFsSilRQCpVIk4uLzJ0ZSVgbmh",
    "GU04nIn4+ZW5kc3RyZWF0CmVuZG9iagp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNzMgMDAwMDAgbiAKMDAwMDAwMDEwNCAwMDAwMCB",
    "uIAowMDAwMDAwMjExIDAwMDAwIG4gCjAwMDAwMDA0MDQgMDAwMDAgbiAKMDAwMDAwMDQ3MiAwMDAwMCBuIAowMDAwMDAwNzY4IDAwMDAwIG4gCjAwMDAwMDA",
    "4MjcgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8MjhkZjkxMmY2NjQyYTA5MTFlZTQzMWQ3MDM3MDk2MGM+PDI4ZGY5MTJmNjY0MmEwOTExZWU0MzFkNzA",
    "zNzA5NjBjPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKGh0dHA6Ly93d3cucmVwb3J0bGFiLmNvbSkKCi9JbmZvIDU",
    "gMCBSCi9Sb290IDQgMCBSCi9TaXplIDgKPj4Kc3RhcnR4cmVmCjExMDMKJSVFT0YK",
  ].join(""),
  docx: `UEsDBBQAAAAAALgUNFudxYoquQEAALkBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbDw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04IiBzdGFuZGFsb25lPSJ5ZXMiPz4KPFR5cGVzIHhtbG5zPSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvcGFja2FnZS8yMDA2L2NvbnRlbnQtdHlwZXMiPgogIDxEZWZhdWx0IEV4dGVuc2lvbj0icmVscyIgQ29udGVudFR5cGU9ImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1wYWNrYWdlLnJlbGF0aW9uc2hpcHMreG1sIi8+CiAgPERlZmF1bHQgRXh0ZW5zaW9uPSJ4bWwiIENvbnRlbnRUeXBlPSJhcHBsaWNhdGlvbi94bWwiLz4KICA8T3ZlcnJpZGUgUGFydE5hbWU9Ii93b3JkL2RvY3VtZW50LnhtbCIgQ29udGVudFR5cGU9ImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50Lm1haW4reG1sIi8+CjwvVHlwZXM+ClBLAwQUAAAAAAC4FDRbLRBNbi0BAAAtAQAACwAAAF9yZWxzLy5yZWxzPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/Pgo8UmVsYXRpb25zaGlwcyB4bWxucz0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL3BhY2thZ2UvMjAwNi9yZWxhdGlvbnNoaXBzIj4KICA8UmVsYXRpb25zaGlwIElkPSJSMSIgVHlwZT0iaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL29mZmljZURvY3VtZW50LzIwMDYvcmVsYXRpb25zaGlwcy9vZmZpY2VEb2N1bWVudCIgVGFyZ2V0PSJ3b3JkL2RvY3VtZW50LnhtbCIvPgo8L1JlbGF0aW9uc2hpcHM+ClBLAwQUAAAAAAC4FDRbrRQbLUoBAABKAQAAEQAAAHdvcmQvZG9jdW1lbnQueG1sPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/Pgo8dzpkb2N1bWVudCB4bWxuczp3PSJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvd29yZHByb2Nlc3NpbmdtbC8yMDA2L21haW4iPgogIDx3OmJvZHk+CiAgICA8dzpwPjx3OnI+PHc6dD5BbnR3ZXJwIHN0cmF0ZWd5IGRvY3g8L3c6dD48L3c6cj48L3c6cD4KICAgIDx3OnA+PHc6cj48dzp0PldvcmQgZml4dHVyZSByZWZlcmVuY2luZyBjb2NhaW5lIHJvdXRlcy48L3c6dD48L3c6cj48L3c6cD4KICAgIDx3OnNlY3RQci8+CiAgPC93OmJvZHk+Cjwvdzpkb2N1bWVudD4KUEsBAhQDFAAAAAAAuBQ0W53Fiiq5AQAAuQEAABMAAAAAAAAAAAAAAIABAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAMUAAAAAAC4FDRbLRBNbi0BAAAtAQAACwAAAAAAAAAAAAAAgAHqAQAAX3JlbHMvLnJlbHNQSwECFAMUAAAAAAC4FDRbrRQbLUoBAABKAQAAEQAAAAAAAAAAAAAAgAFAAwAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAMAAwC5AAAAuQQAAAAA`,
  pages: `UEsDBBQAAAAAALoUNFvdYGZikwAAAJMAAAAJAAAAaW5kZXgueG1sPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPGRvY3VtZW50PgogIDxib2R5PgogICAgPHA+UGFnZXMgZG9jdW1lbnQgZGVzY3JpYmluZyBBbnR3ZXJwIGNvY2FpbmUgcG9ydCByb3V0ZXMuPC9wPgogIDwvYm9keT4KPC9kb2N1bWVudD4KUEsBAhQDFAAAAAAAuhQ0W91gZmKTAAAAkwAAAAkAAAAAAAAAAAAAAIABAAAAAGluZGV4LnhtbFBLBQYAAAAAAQABADcAAAC6AAAAAAA=`
} as const;

const originalEnv = { ...process.env };

async function seedCorpus(dir: string): Promise<void> {
  await fs.writeFile(
    path.join(dir, "note.txt"),
    "Antwerp cocaine port tradecraft captured in plain text.",
    "utf8"
  );
  await fs.writeFile(
    path.join(dir, "report.md"),
    "# Antwerp trafficking\n\nHybrid retrieval anchors Antwerp cocaine port intelligence.",
    "utf8"
  );
  await fs.writeFile(
    path.join(dir, "brief.md"),
    "---\ntitle: Antwerp\ntags: [port]\n---\n\nPort dossiers mention Antwerp cocaine port logistics.",
    "utf8"
  );
  await fs.writeFile(
    path.join(dir, "summary.txt"),
    "Strategic Antwerp cocaine port routes documented in txt fixtures.",
    "utf8"
  );
  await writeBase64File(dir, "intel.pdf", SAMPLE_FILES.pdf);
  await writeBase64File(dir, "route.docx", SAMPLE_FILES.docx);
  await writeBase64File(dir, "field.pages", SAMPLE_FILES.pages);
}

describe("store reindex", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-nn-test-"));
    await seedCorpus(tempDir);
    process.env.MCP_NN_DATA_DIR = path.join(tempDir, ".mcp-nn");
    process.env.TRANSFORMERS_CACHE = path.join(tempDir, "models");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  it("indexes generated corpus and returns hybrid results", async () => {
    const config = await loadConfig();
    config.roots.roots = [tempDir];
    config.roots.include = [".txt", ".md", ".pdf", ".docx", ".pages"];
    const store = await Store.init(config);
    const summary = await reindexPaths(store, [tempDir]);
    expect(summary.updated).toBeGreaterThan(0);
    const stats = store.getStats();
    expect(stats.files).toBeGreaterThan(0);
    expect(stats.chunks).toBeGreaterThan(0);
    const hits = await store.hybridSearch({ query: "Antwerp cocaine port", k: 3, alpha: 0.5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].citation.filePath).toContain(path.basename(tempDir));
  });
});

async function writeBase64File(dir: string, name: string, base64: string): Promise<void> {
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(path.join(dir, name), buffer);
}
