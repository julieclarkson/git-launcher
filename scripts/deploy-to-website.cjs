#!/usr/bin/env node
/**
 * Deploy Case Study Maker outputs to julie_clarkson_website.
 * Renames files to [project]-[type]-[uniqueid] format so they don't overwrite other projects.
 *
 * Usage:
 *   node scripts/deploy-to-website.cjs
 *   node scripts/deploy-to-website.cjs --dry-run
 *
 * Reads OUTPUTS/ and portfolio_data.json. Pushes to https://github.com/julieclarkson/julie_clarkson_website
 * in case-studies/ subfolder.
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } = require('fs');
const { join, resolve } = require('path');
const { execSync } = require('child_process');

const cwd = resolve(__dirname, '..');
const OUTPUTS = join(cwd, 'OUTPUTS');
const DEPLOY_DIR = join(cwd, '_website_push');
const WEBSITE_REPO = 'https://github.com/julieclarkson/julie_clarkson_website.git';
const CASE_STUDIES = 'case-studies';

function getProjectSlug() {
  const dataPath = join(cwd, '.case-study', 'OUTPUTS', 'portfolio_data.json');
  if (existsSync(dataPath)) {
    try {
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
      return (data.projectSlug || (data.projectName || '').toLowerCase().replace(/\s+/g, '')).replace(/[^a-z0-9_-]/g, '') || 'project';
    } catch (_) {}
  }
  return require('path').basename(cwd).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'project';
}

function getUniqueId(filename) {
  const m = filename.match(/-(\d{8}-\d{6})(?:\.|$)/);
  return m ? m[1] : require('child_process').execSync('date +%Y%m%d-%H%M%S', { encoding: 'utf-8' }).trim();
}

function discoverOutputs() {
  if (!existsSync(OUTPUTS)) return [];
  const files = readdirSync(OUTPUTS);
  const results = [];
  for (const f of files) {
    if (f.endsWith('.html')) {
      const base = f.replace(/\.html$/, '');
      const type = base.includes('portfolio') ? 'portfolio' : base.includes('marketing') ? 'marketing' : base.includes('pitch-deck') ? 'pitch-deck' : null;
      if (type) {
        const uniqueId = getUniqueId(base);
        results.push({ base, type, uniqueId, html: f });
      }
    }
  }
  return results;
}

function buildDeployBundle(projectSlug, outputs) {
  const bundleDir = join(cwd, 'DEPLOY_WEBSITE', CASE_STUDIES);
  mkdirSync(join(bundleDir, 'themes', 'default'), { recursive: true });

  const assets = [];
  for (const o of outputs) {
    const newBase = `${projectSlug}-${o.type}-${o.uniqueId}`;
    const oldBase = o.base;

    const htmlPath = join(OUTPUTS, o.html);
    let html = readFileSync(htmlPath, 'utf-8');
    html = html
      .replace(new RegExp(oldBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.css', 'g'), `${newBase}.css`)
      .replace(new RegExp(oldBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.js', 'g'), `${newBase}.js`);
    writeFileSync(join(bundleDir, `${newBase}.html`), html, 'utf-8');

    const cssPath = join(OUTPUTS, `${oldBase}.css`);
    if (existsSync(cssPath)) {
      copyFileSync(cssPath, join(bundleDir, `${newBase}.css`));
    }
    const jsPath = join(OUTPUTS, `${oldBase}.js`);
    if (existsSync(jsPath)) {
      copyFileSync(jsPath, join(bundleDir, `${newBase}.js`));
    }
    assets.push({ type: o.type, base: newBase });
  }

  const varsPath = join(OUTPUTS, 'themes', 'default', 'variables.css');
  if (existsSync(varsPath)) {
    copyFileSync(varsPath, join(bundleDir, 'themes', 'default', 'variables.css'));
  }

  return assets;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const projectSlug = getProjectSlug();
  const outputs = discoverOutputs();

  if (outputs.length === 0) {
    console.error('No portfolio/marketing/pitch-deck HTML files found in OUTPUTS/. Run /generate first.');
    process.exit(1);
  }

  console.log(`Project: ${projectSlug}`);
  console.log(`Outputs: ${outputs.map(o => o.html).join(', ')}`);
  const assets = buildDeployBundle(projectSlug, outputs);
  console.log(`Deploy bundle: DEPLOY_WEBSITE/${CASE_STUDIES}/`);
  console.log(`  ${assets.map(a => `${a.base}.html`).join(', ')}`);

  if (dryRun) {
    console.log('\n[--dry-run] Skipping clone, copy, commit, push.');
    return;
  }

  if (existsSync(DEPLOY_DIR)) {
    execSync('git fetch origin && git pull origin main', { cwd: DEPLOY_DIR, stdio: 'inherit' });
  } else {
    execSync(`git clone ${WEBSITE_REPO} ${DEPLOY_DIR}`, { cwd, stdio: 'inherit' });
  }

  const destDir = join(DEPLOY_DIR, CASE_STUDIES);
  mkdirSync(destDir, { recursive: true });
  const bundleDir = join(cwd, 'DEPLOY_WEBSITE', CASE_STUDIES);

  function copyRecursive(src, dest) {
    const stat = require('fs').statSync(src);
    if (stat.isDirectory()) {
      mkdirSync(dest, { recursive: true });
      for (const name of readdirSync(src)) {
        copyRecursive(join(src, name), join(dest, name));
      }
    } else {
      copyFileSync(src, dest);
    }
  }
  for (const f of readdirSync(bundleDir, { withFileTypes: true })) {
    copyRecursive(join(bundleDir, f.name), join(destDir, f.name));
  }

  execSync('git add -A', { cwd: DEPLOY_DIR, stdio: 'inherit' });
  const status = execSync('git status --short', { cwd: DEPLOY_DIR, encoding: 'utf-8' });
  if (!status.trim()) {
    console.log('No changes to push.');
    return;
  }
  execSync(`git commit -m "Add ${projectSlug} case studies: ${assets.map(a => a.type).join(', ')} (${assets[0]?.base?.split('-').pop() || 'deploy'})"`, { cwd: DEPLOY_DIR, stdio: 'inherit' });
  execSync('git push origin main', { cwd: DEPLOY_DIR, stdio: 'inherit' });
  console.log('\nPushed to julie_clarkson_website.');
}

main();
