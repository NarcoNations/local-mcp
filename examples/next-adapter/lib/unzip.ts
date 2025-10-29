import { unzip } from 'unzipit';

export type Unzipped = {
  files: { path: string; data: ArrayBuffer }[];
};

export async function unzipToMemory(zipBytes: ArrayBuffer): Promise<Unzipped> {
  const { entries } = await unzip(new Uint8Array(zipBytes));
  const files: { path: string; data: ArrayBuffer }[] = [];
  for (const [path, entry] of Object.entries(entries)) {
    if (entry.isDirectory) continue;
    const data = await entry.arrayBuffer();
    files.push({ path, data });
  }
  return { files };
}
