#!/usr/bin/env node
/**
 * Generate index.html card HTML for a project. Outputs a chunk you can paste into your portfolio index.
 *
 * Usage:
 *   node scripts/generate-index-card.cjs
 *   node scripts/generate-index-card.cjs --base-path case-studies/
 *
 * Reads portfolio_data.json and scans OUTPUTS for [project]-[type]-[timestamp].html files.
 * Writes OUTPUTS/index-card.html with the project-specific card chunk.
 */

const { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } = require('fs');
const { join, resolve } = require('path');

const cwd = resolve(__dirname, '..');
const OUTPUTS = join(cwd, 'OUTPUTS');
const DATA_PATHS = [
  join(cwd, '.case-study', 'OUTPUTS', 'portfolio_data.json'),
  join(cwd, 'OUTPUTS', 'portfolio_data.json'),
];

function loadData() {
  for (const p of DATA_PATHS) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, 'utf-8'));
      } catch (_) {}
    }
  }
  return null;
}

function discoverAssets(projectSlug) {
  if (!existsSync(OUTPUTS)) return [];
  const files = readdirSync(OUTPUTS);
  const candidates = [];
  const uniqueIdRe = /-(\d{8}-\d{6})(?:\.|$)/;
  for (const f of files) {
    if (!f.endsWith('.html') || f === 'index-card.html') continue;
    const base = f.replace(/\.html$/, '');
    const m = base.match(new RegExp(`^${projectSlug}-(portfolio|marketing|pitch-deck)-(\\d{8}-\\d{6})$`));
    const tid = base.match(uniqueIdRe)?.[1];
    if (m) {
      candidates.push({ type: m[1], base, deployedBase: `${projectSlug}-${m[1]}-${m[2]}`, uniqueId: m[2] });
    } else if (/^(portfolio|marketing|pitch-deck)[-_].*/.test(base) && tid && !base.includes('card')) {
      const type = base.includes('portfolio') ? 'portfolio' : base.includes('marketing') ? 'marketing' : 'pitch-deck';
      candidates.push({ type, base, deployedBase: `${projectSlug}-${type}-${tid}`, uniqueId: tid });
    }
  }
  // Keep only the latest per type (deduplicate by type)
  const byType = {};
  for (const a of candidates) {
    const prev = byType[a.type];
    if (!prev || (a.uniqueId > prev.uniqueId)) byType[a.type] = a;
  }
  return Object.values(byType).sort((a, b) => {
    const order = { portfolio: 0, marketing: 1, 'pitch-deck': 2 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCard(data, assets, basePath = '') {
  const prefix = basePath ? basePath.replace(/\/$/, '') + '/' : '';
  const name = escapeHtml(data.projectName || 'Project');
  const summary = escapeHtml(data.summary || '');
  const badge = escapeHtml(data.badge || 'Project');
  const repoUrl = (data.repoUrl || '').trim() || '#';

  let linksHtml = '';
  for (const a of assets) {
    const href = prefix + (a.deployedBase || a.base) + '.html';
    const label = a.type === 'portfolio' ? 'Read the case study' : a.type === 'marketing' ? 'View the marketing landing page' : 'View the pitch deck';
    linksHtml += `
              <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-2 mt-4 text-sm font-medium text-accent hover:underline">
                + ${escapeHtml(label)}
                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
              </a>
              <p></p>`;
  }

  return `<!-- Project Card: ${name} -->
        <article class="card-elegant bg-white/70 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <span class="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center">
                  <i class="fa-solid fa-brain text-accent text-sm"></i>
                </span>
                <span class="text-xs font-semibold uppercase tracking-wider text-accent">${badge}</span>
              </div>

              <h3 class="font-serif text-2xl font-medium text-ink mb-2">${name}</h3>

              <p class="text-ink-muted leading-relaxed">
                 ${summary}
              </p>
              <br>
${linksHtml}
            </div>

            <div class="flex-shrink-0">
              <a href="${escapeHtml(repoUrl)}" target="_blank" rel="noopener noreferrer"
                class="btn-elegant inline-flex items-center gap-2 text-sm font-medium text-white bg-emerald-600 px-5 py-3 rounded-xl">
                <span>${escapeHtml(data.repoLabel || 'View on GitHub')}</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
              </a>
            </div>
          </div>
        </article>`;
}

function main() {
  const args = process.argv.slice(2);
  let basePath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base-path' && args[i + 1]) basePath = args[++i];
  }

  const data = loadData();
  if (!data) {
    console.error('No portfolio_data.json found. Run /generate first.');
    process.exit(1);
  }

  const projectSlug = (data.projectSlug || (data.projectName || '').toLowerCase().replace(/\s+/g, '')).replace(/[^a-z0-9_-]/g, '') || 'project';
  const assets = discoverAssets(projectSlug);

  if (assets.length === 0) {
    const files = existsSync(OUTPUTS) ? readdirSync(OUTPUTS).filter(f => f.endsWith('.html') && f !== 'index-card.html') : [];
    const uniqueIdRe = /-(\d{8}-\d{6})(?:\.|$)/;
    const byType = {};
    for (const f of files) {
      const base = f.replace(/\.html$/, '');
      const tid = base.match(uniqueIdRe)?.[1];
      if (tid && !base.includes('card')) {
        const type = base.includes('portfolio') ? 'portfolio' : base.includes('marketing') ? 'marketing' : 'pitch-deck';
        const a = { type, base, deployedBase: `${projectSlug}-${type}-${tid}`, uniqueId: tid };
        if (!byType[type] || tid > byType[type].uniqueId) byType[type] = a;
      }
    }
    assets.push(...Object.values(byType));
  }

  const html = renderCard(data, assets, basePath);
  const outPath = join(OUTPUTS, 'index-card.html');
  mkdirSync(OUTPUTS, { recursive: true });
  writeFileSync(outPath, html, 'utf-8');
  console.log(`Wrote ${outPath}`);
  console.log('\nPaste this into your index.html:\n');
  console.log(html);
}

main();
