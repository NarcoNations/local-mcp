import { execSync } from 'node:child_process';
import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

async function copyDir(src, dest) {
  const entries = await readdir(src, { withFileTypes: true });
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

run('npm run build:ts');

const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');

try {
  const s = await stat(publicDir);
  if (s.isDirectory()) {
    await copyDir(publicDir, distDir);
  }
} catch (err) {
  if (err && err.code !== 'ENOENT') throw err;
}
