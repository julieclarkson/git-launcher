import pc from 'picocolors';

const results = { required: [], optional: [] };

function check(name, passed, required = true) {
  const icon = passed ? pc.green('✓') : required ? pc.red('✗') : pc.yellow('⚠');
  const label = passed ? pc.green(name) : required ? pc.red(name) : pc.yellow(name);
  const status = passed ? 'pass' : required ? 'FAIL' : 'skip';
  console.log(`  ${icon} ${label}`);
  (required ? results.required : results.optional).push({ name, status });
}

console.log(pc.bold('\nGit Launcher — Dependency Check\n'));

// Node.js >= 18
const nodeVersion = parseInt(process.version.slice(1), 10);
check(`Node.js >= 18 (found ${process.version})`, nodeVersion >= 18);

// Playwright
let playwrightOk = false;
try {
  await import('playwright');
  playwrightOk = true;
} catch { /* not installed */ }
check('Playwright installed', playwrightOk);

if (playwrightOk) {
  let chromiumOk = false;
  try {
    const pw = await import('playwright');
    const browser = await pw.chromium.launch({ headless: true });
    await browser.close();
    chromiumOk = true;
  } catch { /* chromium not available */ }
  check('Playwright Chromium browser', chromiumOk);
}

// sharp
let sharpOk = false;
try {
  await import('sharp');
  sharpOk = true;
} catch { /* not installed */ }
check('sharp image processing', sharpOk, false);

console.log('');

const failed = results.required.filter(r => r.status === 'FAIL');
if (failed.length > 0) {
  console.log(pc.red(`${failed.length} required check(s) failed.`));
  console.log(pc.dim('Run: npm run setup'));
  process.exit(1);
} else {
  console.log(pc.green('All required checks passed.'));
  const skipped = results.optional.filter(r => r.status === 'skip');
  if (skipped.length > 0) {
    console.log(pc.yellow(`${skipped.length} optional dependency not available (non-blocking).`));
  }
}
