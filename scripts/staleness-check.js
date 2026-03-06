import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORE = new Set(['node_modules', '.DS_Store', '.fingerprint', 'git-launch']);

async function walk(dir, root, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, root, files);
    } else {
      files.push(join(dir, e.name).replace(root, '').replace(/^\//, ''));
    }
  }
  return files;
}

async function computeProductionHash(productionDir) {
  const root = resolve(productionDir);
  const files = await walk(root, root);
  files.sort();

  const hash = createHash('sha256');
  for (const rel of files) {
    const full = join(root, rel);
    try {
      const content = await readFile(full, 'utf8');
      hash.update(rel);
      hash.update('\0');
      hash.update(content);
      hash.update('\0');
    } catch {
      // Skip unreadable files (e.g. binary)
    }
  }
  return 'sha256-' + hash.digest('hex');
}

async function checkStaleness(productionDir, gitLaunchDir) {
  const fingerprintPath = join(resolve(gitLaunchDir), '.fingerprint');
  let stored;
  try {
    const raw = await readFile(fingerprintPath, 'utf8');
    stored = JSON.parse(raw);
  } catch {
    return { stale: true, reason: 'No fingerprint found — assets may never have been generated.' };
  }

  const currentHash = await computeProductionHash(productionDir);
  if (stored.productionHash !== currentHash) {
    return {
      stale: true,
      reason: 'Production folder has changed since assets were generated.',
      generatedAt: stored.generatedAt,
    };
  }
  return { stale: false, reason: 'Assets are up to date.', generatedAt: stored.generatedAt };
}

async function writeFingerprint(productionDir, gitLaunchDir) {
  const currentHash = await computeProductionHash(productionDir);
  const fingerprint = {
    generatedAt: new Date().toISOString(),
    productionHash: currentHash,
  };
  const fingerprintPath = join(resolve(gitLaunchDir), '.fingerprint');
  await writeFile(fingerprintPath, JSON.stringify(fingerprint, null, 2) + '\n', 'utf8');
  return { written: true, hash: currentHash };
}

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes('--write');
  const pos = args.filter(a => a !== '--write');

  const productionDir = resolve(pos[0] || '..');
  const gitLaunchDir = resolve(pos[1] || '../git-launch');

  if (writeMode) {
    await writeFingerprint(productionDir, gitLaunchDir);
    console.log(JSON.stringify({ success: true, message: 'Fingerprint written.' }));
    return;
  }

  const result = await checkStaleness(productionDir, gitLaunchDir);
  console.log(JSON.stringify(result));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
}

export { checkStaleness, writeFingerprint, computeProductionHash };
