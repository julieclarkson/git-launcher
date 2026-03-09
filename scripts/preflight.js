import { access, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import pc from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAUNCHER_DIR = resolve(join(__dirname, '..'));

function parseTarget() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      return resolve(args[i + 1]);
    }
  }
  return resolve(join(LAUNCHER_DIR, '..'));
}

const PROJECT_ROOT = parseTarget();

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: LAUNCHER_DIR, stdio: 'inherit', ...opts });
  } catch (err) {
    return null;
  }
}

async function preflight() {
  console.log(pc.bold('\n🚀 Git Launcher — Preflight\n'));

  const needsSetup = !(await exists(join(LAUNCHER_DIR, 'node_modules')));

  if (needsSetup) {
    console.log(pc.yellow('First run detected — installing dependencies...\n'));
    run('npm install');
    console.log('');
    console.log(pc.dim('Installing Playwright Chromium (for screenshots)...'));
    run('npx playwright install chromium');
    console.log('');
  }

  console.log(pc.dim('Verifying dependencies...'));
  const verifyResult = run('node scripts/verify-setup.js', { stdio: 'pipe' });
  if (verifyResult === null) {
    console.log(pc.yellow('  Some dependencies missing — running setup...'));
    console.log('');
    const setupResult = run('npm run setup');
    if (setupResult === null) {
      console.log('');
      console.log(pc.yellow('  ⚠ Setup had issues (screenshots may not work)'));
      console.log(pc.dim('    Run manually if needed: cd .git-launcher && npm run setup'));
    }
  } else {
    console.log(pc.green('  ✓ Dependencies OK'));
  }

  console.log(pc.dim('Verifying rule safety...'));
  const ruleFile = join(LAUNCHER_DIR, 'rules', 'run-git-launcher.mdc');
  if (await exists(ruleFile)) {
    const ruleContent = await readFile(ruleFile, 'utf8');
    if (!/^alwaysApply:\s*false$/m.test(ruleContent)) {
      console.log(pc.red('  ✗ SECURITY: rules/run-git-launcher.mdc has been tampered with.'));
      console.log(pc.red('    alwaysApply MUST be false. This rule triggers file writes and script execution.'));
      console.log(pc.red('    Aborting. Restore the original file from the git-launcher repository.'));
      process.exit(1);
    }
    console.log(pc.green('  ✓ Rule alwaysApply: false verified'));
  }

  console.log(pc.dim('Running security checks...'));
  const secResult = run(`node scripts/pre-build-check.js "${PROJECT_ROOT}"`, { stdio: 'pipe' });
  if (secResult === null) {
    console.log(pc.red('  ✗ Security checks failed — run: cd .git-launcher && npm run security:check'));
    console.log('');
    process.exit(1);
  }
  console.log(pc.green('  ✓ Security checks passed'));

  const gitLaunchDir = join(PROJECT_ROOT, '..', 'git-launch');
  const gitLaunchExists = await exists(gitLaunchDir);
  if (gitLaunchExists) {
    try {
      const { checkStaleness } = await import('./staleness-check.js');
      const staleness = await checkStaleness(PROJECT_ROOT, gitLaunchDir);
      if (staleness.stale) {
        console.log(pc.yellow('  ⚠ Launch assets may be outdated — production/ has changed since last generation. Run "run git launcher" to update.'));
      }
    } catch {
      /* ignore staleness errors */
    }
  }

  console.log(pc.dim('Detecting project...'));
  const detectOutput = execSync(`node scripts/detect-project.js "${PROJECT_ROOT}"`, {
    cwd: LAUNCHER_DIR, encoding: 'utf8',
  });
  const project = JSON.parse(detectOutput);

  console.log('');
  console.log(pc.bold('Project detected:'));
  console.log(`  Name:       ${pc.cyan(project.name)}`);
  console.log(`  Language:   ${project.language}`);
  console.log(`  Framework:  ${project.framework || 'none detected'}`);
  console.log(`  Files:      ${project.fileCount}`);
  console.log(`  Entry:      ${project.mainEntryPoint || 'not found'}`);
  if (project.startCommand) {
    console.log(`  Dev server: ${pc.dim(project.startCommand)}`);
  }
  console.log('');
  console.log(pc.bold(pc.green('✓ Preflight complete — ready to generate assets')));
  console.log('');

  const result = {
    status: 'ready',
    project,
    launcherDir: LAUNCHER_DIR,
    projectRoot: PROJECT_ROOT,
    firstRun: needsSetup,
  };

  console.log(JSON.stringify(result));
}

preflight().catch(err => {
  console.error(pc.red(`Preflight failed: ${err.message}`));
  process.exit(1);
});
