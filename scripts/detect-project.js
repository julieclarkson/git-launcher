import { readdir, readFile, access } from 'node:fs/promises';
import { join, extname, basename, resolve } from 'node:path';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'target', 'vendor', '.git-launcher', 'git-launch', '.case-study',
  '.casestudy', '.venv', 'env', 'venv', 'coverage', '.turbo',
]);

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJSON(p) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}

async function countFiles(dir, depth = 0) {
  if (depth > 6) return 0;
  let count = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || IGNORE_DIRS.has(e.name)) continue;
      if (e.isDirectory()) count += await countFiles(join(dir, e.name), depth + 1);
      else count++;
    }
  } catch { /* skip unreadable dirs */ }
  return count;
}

async function collectExtensions(dir, exts = {}, depth = 0) {
  if (depth > 4) return exts;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || IGNORE_DIRS.has(e.name)) continue;
      if (e.isDirectory()) {
        await collectExtensions(join(dir, e.name), exts, depth + 1);
      } else {
        const ext = extname(e.name).toLowerCase();
        if (ext) exts[ext] = (exts[ext] || 0) + 1;
      }
    }
  } catch { /* skip */ }
  return exts;
}

function detectLanguage(exts) {
  const langMap = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.rb': 'ruby',
    '.ex': 'elixir', '.exs': 'elixir',
    '.java': 'java',
    '.cs': 'csharp',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
  };
  let best = null;
  let bestCount = 0;
  for (const [ext, count] of Object.entries(exts)) {
    const lang = langMap[ext];
    if (lang && count > bestCount) { best = lang; bestCount = count; }
  }
  return best || 'unknown';
}

async function detectFramework(root) {
  const markers = [
    ['next.config.js', 'nextjs'], ['next.config.mjs', 'nextjs'], ['next.config.ts', 'nextjs'],
    ['nuxt.config.ts', 'nuxt'], ['nuxt.config.js', 'nuxt'],
    ['svelte.config.js', 'sveltekit'], ['svelte.config.ts', 'sveltekit'],
    ['angular.json', 'angular'],
    ['vite.config.js', 'vite'], ['vite.config.ts', 'vite'], ['vite.config.mjs', 'vite'],
    ['astro.config.mjs', 'astro'], ['astro.config.ts', 'astro'],
    ['remix.config.js', 'remix'],
    ['gatsby-config.js', 'gatsby'],
    ['Cargo.toml', 'rust-cargo'],
    ['go.mod', 'go-mod'],
    ['Gemfile', 'ruby-bundler'],
    ['mix.exs', 'elixir-mix'],
    ['pyproject.toml', 'python-pyproject'],
    ['requirements.txt', 'python-pip'],
  ];
  for (const [file, fw] of markers) {
    if (await exists(join(root, file))) return fw;
  }
  return null;
}

function detectStartCommand(pkg, framework) {
  if (pkg?.scripts?.dev) return `npm run dev`;
  if (pkg?.scripts?.start) return `npm start`;
  if (framework === 'python-pip' || framework === 'python-pyproject') return 'python main.py';
  if (framework === 'rust-cargo') return 'cargo run';
  if (framework === 'go-mod') return 'go run .';
  if (framework === 'ruby-bundler') return 'bundle exec ruby app.rb';
  return null;
}

function detectPort(pkg, framework) {
  const devScript = pkg?.scripts?.dev || pkg?.scripts?.start || '';
  const portMatch = devScript.match(/(?:--port|PORT=|:\s*)(\d{4,5})/);
  if (portMatch) return parseInt(portMatch[1], 10);
  const frameworkPorts = {
    nextjs: 3000, vite: 5173, nuxt: 3000, sveltekit: 5173,
    angular: 4200, astro: 4321, remix: 3000, gatsby: 8000,
  };
  return frameworkPorts[framework] || 3000;
}

async function findEntryPoint(root, language, framework) {
  const candidates = [
    'src/app/page.tsx', 'src/app/page.jsx', 'src/pages/index.tsx', 'src/pages/index.jsx',
    'src/index.ts', 'src/index.tsx', 'src/index.js', 'src/index.jsx',
    'src/main.ts', 'src/main.tsx', 'src/main.js',
    'src/App.tsx', 'src/App.jsx', 'src/App.vue',
    'app/page.tsx', 'app/page.jsx', 'pages/index.tsx', 'pages/index.jsx',
    'index.ts', 'index.js', 'index.html',
    'main.py', 'app.py', 'src/main.py', 'src/main.rs', 'main.go', 'cmd/main.go',
  ];
  for (const c of candidates) {
    if (await exists(join(root, c))) return c;
  }
  return null;
}

async function hasTestFiles(root) {
  const testDirs = ['__tests__', 'tests', 'test', 'spec'];
  for (const d of testDirs) {
    if (await exists(join(root, d))) return true;
  }
  try {
    const srcEntries = await readdir(join(root, 'src'), { withFileTypes: true, recursive: false });
    for (const e of srcEntries) {
      if (e.name.match(/\.(test|spec)\./)) return true;
    }
  } catch { /* no src */ }
  return false;
}

async function detect(projectRoot) {
  const pkg = await readJSON(join(projectRoot, 'package.json'));
  const exts = await collectExtensions(projectRoot);
  const language = detectLanguage(exts);
  const framework = await detectFramework(projectRoot);
  const startCommand = detectStartCommand(pkg, framework);
  const port = detectPort(pkg, framework);

  const deps = pkg?.dependencies ? Object.keys(pkg.dependencies) : [];
  const devDeps = pkg?.devDependencies ? Object.keys(pkg.devDependencies) : [];

  const result = {
    name: pkg?.name || basename(projectRoot),
    description: pkg?.description || null,
    language,
    framework,
    startCommand,
    port,
    hasEnvFile: (await exists(join(projectRoot, '.env'))) || (await exists(join(projectRoot, '.env.example'))),
    hasExistingReadme: await exists(join(projectRoot, 'README.md')),
    hasTests: await hasTestFiles(projectRoot),
    hasCaseStudy: (await exists(join(projectRoot, '.case-study'))) || (await exists(join(projectRoot, '.casestudy'))),
    hasDocker: await exists(join(projectRoot, 'Dockerfile')),
    dependencies: deps,
    devDependencies: devDeps,
    fileCount: await countFiles(projectRoot),
    mainEntryPoint: await findEntryPoint(projectRoot, language, framework),
    license: pkg?.license || null,
  };

  return result;
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
  console.error('Usage: node detect-project.js <projectRoot>');
  process.exit(1);
}

try {
  const safeRoot = validateProjectRoot(projectRoot);
  const result = await detect(safeRoot);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
