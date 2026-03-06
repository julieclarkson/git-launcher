import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 375,  height: 812 },
};

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

function validateUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Disallowed protocol: ${parsed.protocol}. Only http/https/file allowed.`);
  }
  if (parsed.protocol === 'file:') {
    return parsed.href;
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `URL hostname "${parsed.hostname}" not allowed. ` +
      `Only localhost/127.0.0.1 permitted (SSRF prevention). ` +
      `Allowed: ${[...ALLOWED_HOSTS].join(', ')}`
    );
  }
  return parsed.href;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { projectRoot: null, port: 3000, url: null, preview: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preview') {
      opts.preview = true;
    } else if (args[i] === '--port' && args[i + 1]) {
      opts.port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      opts.url = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      opts.projectRoot = args[i];
    }
  }

  if (opts.preview) {
    opts.url = null;
  } else if (!opts.url) {
    opts.url = `http://localhost:${opts.port}`;
    opts.url = validateUrl(opts.url);
  } else {
    opts.url = validateUrl(opts.url);
  }
  return opts;
}

async function checkServer(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function run() {
  const opts = parseArgs(process.argv);

  if (!opts.projectRoot) {
    console.log(JSON.stringify({
      success: false,
      message: 'Usage: node screenshot-runner.js <projectRoot> [--port 3000] [--url <url>] [--preview]'
    }));
    process.exit(1);
  }

  const projectResolved = resolve(opts.projectRoot);
  const outputDir = join(projectResolved, 'git-launch', 'images');
  if (!outputDir.startsWith(projectResolved)) {
    console.log(JSON.stringify({ success: false, message: 'Output path escapes project root' }));
    process.exit(1);
  }
  await mkdir(outputDir, { recursive: true });

  if (opts.preview) {
    const generateScript = join(__dirname, 'generate-preview.js');
    const out = execFileSync(process.execPath, [generateScript, projectResolved], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    const line = String(out).trim().split('\n').pop();
    const parsed = JSON.parse(line);
    if (!parsed.success || !parsed.fileUrl) {
      console.log(JSON.stringify({
        success: false,
        message: parsed.message || 'Failed to generate preview.',
      }));
      process.exit(1);
    }
    opts.url = parsed.fileUrl;
  }

  const isFileUrl = opts.url.startsWith('file://');
  if (isFileUrl) {
    const pathname = decodeURIComponent(new URL(opts.url).pathname);
    const filePath = process.platform === 'win32' ? pathname.replace(/^\/([a-zA-Z]):/, '$1:') : pathname;
    const normalized = resolve(filePath);
    if (!normalized.startsWith(projectResolved)) {
      console.log(JSON.stringify({
        success: false,
        message: 'file:// URL path must be inside project root.',
      }));
      process.exit(1);
    }
  }

  if (!isFileUrl) {
    const reachable = await checkServer(opts.url);
    if (!reachable) {
      console.log(JSON.stringify({
        success: false,
        message: `Server not reachable at ${opts.url}. Start your dev server first.`
      }));
      process.exit(1);
    }
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      message: `Playwright Chromium not available. Run: npx playwright install chromium\n${err.message}`
    }));
    process.exit(1);
  }

  const screenshots = {};

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    try {
      await page.goto(opts.url, { waitUntil: isFileUrl ? 'domcontentloaded' : 'networkidle', timeout: 15000 });
    } catch {
      try {
        await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch { /* capture whatever loaded */ }
    }

    await page.waitForTimeout(isFileUrl ? 500 : 2000);

    const filePath = join(outputDir, `${name}.png`);
    await page.screenshot({ path: filePath, clip: { x: 0, y: 0, ...viewport } });
    screenshots[name] = filePath;

    await context.close();
  }

  await browser.close();

  console.log(JSON.stringify({
    success: true,
    screenshots,
    viewports: VIEWPORTS,
  }));
}

run().catch(err => {
  console.log(JSON.stringify({
    success: false,
    message: err.message,
  }));
  process.exit(1);
});
