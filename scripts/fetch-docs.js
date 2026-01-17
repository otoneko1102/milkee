#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const repoRaw = 'https://raw.githubusercontent.com/otoneko1102/coffeescript-milkee/main/';
const files = ['README.md', 'README-ja.md', 'docs/PLUGIN.md', 'docs/PLUGIN-ja.md'];

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function fetchFile(file) {
  const url = repoRaw + file;
  console.log('Fetching', url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      return null;
    }
    const text = await res.text();
    return text;
  } catch (err) {
    console.error('Fetch error', err);
    return null;
  }
}

(async () => {
  const outDir = path.resolve('./src/content');
  await ensureDir(outDir);

  for (const f of files) {
    const content = await fetchFile(f);
    // If file lives under docs/, write it to content root (e.g., docs/PLUGIN.md -> src/content/PLUGIN.md)
    const filename = f.startsWith('docs/') ? path.basename(f) : f;
    const outPath = path.join(outDir, filename);
    // ensure directory exists
    await ensureDir(path.dirname(outPath));
    if (content === null) {
      console.warn(`Skipping write for ${f} (fetch failed)`);
      continue;
    }
    await fs.writeFile(outPath, content, 'utf8');
    console.log('Wrote', outPath);
  }

  console.log('Done fetching docs.');
})();
