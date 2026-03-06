import { readdir, readFile, access } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import pc from 'picocolors';

const WORKSPACE = resolve(process.argv[2] || join(process.cwd(), '..'));

const ENV_FILE_PATTERNS = [
  '.env', '.env.local', '.env.development', '.env.production',
  '.env.staging', '.env.test',
];

const SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]{20,}/,
  /sk_test_[a-zA-Z0-9]{20,}/,
  /AKIA[A-Z0-9]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /gho_[a-zA-Z0-9]{36}/,
  /github_pat_[a-zA-Z0-9_]{60,}/,
  /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/,
  /xox[bpsa]-[a-zA-Z0-9-]{10,}/,
];

const SCANNABLE_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.yaml', '.yml', '.toml', '.md',
  '.py', '.rs', '.go', '.rb', '.sh',
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', 'target', 'vendor', '.git-launcher',
  'git-launch', '.case-study', '.casestudy', 'coverage',
  '.turbo',
]);

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(msg) { console.log(`  ${pc.green('✓')} ${msg}`); passed++; }
function fail(msg) { console.log(`  ${pc.red('✗')} ${msg}`); failed++; }
function warn(msg) { console.log(`  ${pc.yellow('⚠')} ${msg}`); warnings++; }

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function collectFiles(dir, files = [], depth = 0) {
  if (depth > 6) return files;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.env' && !e.name.startsWith('.env.')) continue;
      if (IGNORE_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await collectFiles(full, files, depth + 1);
      } else {
        files.push(full);
      }
    }
  } catch { /* skip unreadable */ }
  return files;
}

console.log(pc.bold('\nGit Launcher — Pre-Build Security Check\n'));
console.log(pc.dim(`  Workspace: ${WORKSPACE}\n`));

// 1. Check for .env files
console.log(pc.bold('Secrets in workspace:'));
let envFound = false;
for (const pattern of ENV_FILE_PATTERNS) {
  if (await exists(join(WORKSPACE, pattern))) {
    fail(`Found ${pattern} — remove it or add to .gitignore`);
    envFound = true;
  }
}
if (!envFound) pass('No .env files found in workspace root');

// 2. Scan source files for hardcoded secrets
console.log(pc.bold('\nHardcoded secret patterns:'));
const allFiles = await collectFiles(WORKSPACE);
const scannable = allFiles.filter(f => SCANNABLE_EXTS.has(extname(f).toLowerCase()));
let secretsFound = false;
for (const file of scannable) {
  try {
    const content = await readFile(file, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        fail(`Potential secret in ${file.replace(WORKSPACE + '/', '')}`);
        secretsFound = true;
        break;
      }
    }
  } catch { /* skip unreadable */ }
}
if (!secretsFound) pass('No hardcoded secret patterns detected');

// 3. Check .gitignore covers secrets
console.log(pc.bold('\n.gitignore coverage:'));
const gitignoreCandidates = [
  join(WORKSPACE, '.gitignore'),
  join(WORKSPACE, '..', '.gitignore'),
];
let gitignoreFound = false;
for (const gp of gitignoreCandidates) {
  if (await exists(gp)) {
    const gitignore = await readFile(gp, 'utf8');
    const mustInclude = ['.env', 'node_modules', '.DS_Store'];
    for (const entry of mustInclude) {
      if (gitignore.includes(entry)) {
        pass(`.gitignore covers ${entry}`);
      } else {
        fail(`.gitignore missing ${entry}`);
      }
    }
    gitignoreFound = true;
    break;
  }
}
if (!gitignoreFound) {
  fail('No .gitignore found');
}

// 4. Check package.json uses pinned versions
console.log(pc.bold('\nDependency pinning:'));
const pkgCandidates = [
  join(WORKSPACE, '.git-launcher', 'package.json'),
  join(WORKSPACE, 'package.json'),
];
let pkgFound = false;
for (const pkgPath of pkgCandidates) {
  if (await exists(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    let unpinned = false;
    for (const [name, version] of Object.entries(deps)) {
      if (version.startsWith('^') || version.startsWith('~') || version === '*' || version === 'latest') {
        fail(`${name}@${version} — use exact version`);
        unpinned = true;
      }
    }
    if (!unpinned) pass('All dependencies use exact versions');
    pkgFound = true;
    break;
  }
}
if (!pkgFound) {
  warn('No package.json found');
}

// 5. Check for .DS_Store files
console.log(pc.bold('\nOS artifacts:'));
const dsStoreFiles = allFiles.filter(f => f.endsWith('.DS_Store'));
if (dsStoreFiles.length > 0) {
  warn(`Found ${dsStoreFiles.length} .DS_Store file(s) — add .DS_Store to .gitignore`);
} else {
  pass('No .DS_Store files found');
}

// Summary
console.log(pc.bold('\n' + '─'.repeat(40)));
console.log(`  ${pc.green(`${passed} passed`)}, ${pc.red(`${failed} failed`)}, ${pc.yellow(`${warnings} warnings`)}`);
console.log('');

if (failed > 0) {
  console.log(pc.red('Pre-build security checks FAILED.'));
  process.exit(1);
} else {
  console.log(pc.green('All security checks passed.'));
}
