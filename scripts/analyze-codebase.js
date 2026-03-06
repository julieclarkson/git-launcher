import { readdir, readFile } from 'node:fs/promises';
import { join, extname, relative, dirname, resolve } from 'node:path';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'target', 'vendor', '.git-launcher', 'git-launch', '.case-study',
  '.casestudy', '.venv', 'env', 'venv', 'coverage', '.turbo',
]);

const CODE_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rs', '.go', '.rb', '.ex', '.exs',
  '.java', '.cs', '.php', '.swift', '.kt', '.vue', '.svelte',
]);

const IMPORT_PATTERNS = {
  js: [
    /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g,
  ],
  python: [
    /from\s+([\w.]+)\s+import/g,
    /^import\s+([\w.]+)/gm,
  ],
  go: [
    /import\s+"([^"]+)"/g,
    /import\s+\w+\s+"([^"]+)"/g,
  ],
  rust: [
    /use\s+([\w:]+)/g,
    /mod\s+(\w+)/g,
  ],
};

function getPatternGroup(ext) {
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte'].includes(ext)) return 'js';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  if (ext === '.rs') return 'rust';
  return null;
}

function isRelativeImport(specifier, group) {
  if (group === 'js') return specifier.startsWith('.') || specifier.startsWith('/');
  if (group === 'python') return specifier.startsWith('.');
  return false;
}

async function collectSourceFiles(dir, root, files = [], depth = 0) {
  if (depth > 8) return files;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || IGNORE_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await collectSourceFiles(full, root, files, depth + 1);
      } else if (CODE_EXTS.has(extname(e.name).toLowerCase())) {
        files.push(relative(root, full));
      }
    }
  } catch { /* skip unreadable */ }
  return files;
}

async function extractImports(filePath, root) {
  const ext = extname(filePath).toLowerCase();
  const group = getPatternGroup(ext);
  if (!group) return { local: [], external: [] };

  let content;
  try {
    content = await readFile(join(root, filePath), 'utf8');
  } catch {
    return { local: [], external: [] };
  }

  const patterns = IMPORT_PATTERNS[group] || [];
  const local = [];
  const external = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const specifier = match[1];
      if (!specifier) continue;
      if (isRelativeImport(specifier, group)) {
        local.push(specifier);
      } else {
        const pkgName = specifier.startsWith('@')
          ? specifier.split('/').slice(0, 2).join('/')
          : specifier.split('/')[0];
        external.push(pkgName);
      }
    }
  }

  return { local, external };
}

function resolveLocalImport(fromFile, specifier) {
  const dir = dirname(fromFile);
  let resolved = join(dir, specifier).replace(/\\/g, '/');
  if (resolved.startsWith('/')) resolved = resolved.slice(1);

  const tryExts = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  return tryExts.map(ext => resolved + ext);
}

async function countLines(filePath, root) {
  try {
    const content = await readFile(join(root, filePath), 'utf8');
    return content.split('\n').length;
  } catch { return 0; }
}

function classifyFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.match(/\.(test|spec)\./)) return 'test';
  if (lower.match(/(^|\/)(__tests__|tests?|spec)\//)) return 'test';
  if (lower.match(/(^|\/)(config|\.config)\./)) return 'config';
  if (lower.match(/(^|\/)index\.(ts|js|tsx|jsx)/)) return 'entry';
  if (lower.match(/(^|\/)main\.(ts|js|py|rs|go)/)) return 'entry';
  if (lower.match(/(^|\/)app\/(page|layout)\.(ts|js|tsx|jsx)/)) return 'entry';
  return 'module';
}

async function analyze(projectRoot) {
  const root = resolve(projectRoot);
  const sourceFiles = await collectSourceFiles(root, root);
  const fileSet = new Set(sourceFiles);

  const nodes = [];
  const edges = [];
  const externalDepsSet = new Set();
  const languages = new Set();
  let totalLOC = 0;

  for (const file of sourceFiles) {
    const ext = extname(file).toLowerCase();
    languages.add(ext.slice(1));

    const loc = await countLines(file, root);
    totalLOC += loc;

    nodes.push({
      id: file,
      label: file,
      type: classifyFile(file),
      loc,
    });

    const { local, external } = await extractImports(file, root);

    for (const dep of external) {
      externalDepsSet.add(dep);
    }

    for (const specifier of local) {
      const candidates = resolveLocalImport(file, specifier);
      const target = candidates.find(c => fileSet.has(c));
      if (target) {
        edges.push({ from: file, to: target, type: 'import' });
      }
    }
  }

  return {
    nodes,
    edges,
    externalDeps: [...externalDepsSet].sort(),
    summary: {
      totalFiles: sourceFiles.length,
      totalLOC,
      languages: [...languages].sort(),
    },
  };
}

function validateProjectRoot(inputPath) {
  const resolved = resolve(inputPath);
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const forbidden = ['/', '/etc', '/usr', '/var', '/tmp', '/System', '/Library', home];
  if (forbidden.includes(resolved)) {
    throw new Error(`Refusing to scan sensitive directory: ${resolved}`);
  }
  return resolved;
}

const projectRoot = process.argv[2];
if (!projectRoot) {
  console.error('Usage: node analyze-codebase.js <projectRoot> [--entry src/index.ts]');
  process.exit(1);
}

try {
  const safeRoot = validateProjectRoot(projectRoot);
  const result = await analyze(safeRoot);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
