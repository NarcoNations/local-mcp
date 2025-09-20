import { promises as fs } from "fs";
import path from "path";

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const src = path.join(process.cwd(), "public");
  const dest = path.join(process.cwd(), "dist");
  try {
    await fs.access(src);
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  await copyDir(src, dest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
