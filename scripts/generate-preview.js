import { readFile, readdir, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAUNCHER_DIR = resolve(join(__dirname, '..'));

const GITHUB_CSS = `
  .markdown-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #24292f; }
  .markdown-body h1, .markdown-body h2 { padding-bottom: 0.3em; border-bottom: 1px solid #d0d7de; margin-top: 24px; }
  .markdown-body h1 { font-size: 2em; }
  .markdown-body h2 { font-size: 1.5em; }
  .markdown-body code { padding: 0.2em 0.4em; background: #f6f8fa; border-radius: 6px; font-size: 85%; }
  .markdown-body pre { padding: 16px; background: #f6f8fa; border-radius: 6px; overflow: auto; }
  .markdown-body pre code { padding: 0; background: none; }
  .markdown-body ul { padding-left: 2em; }
  .markdown-body a { color: #0969da; }
  .markdown-body blockquote { padding: 0 1em; color: #57606a; border-left: 4px solid #d0d7de; margin: 0 0 16px 0; }
  .markdown-body table { border-collapse: collapse; width: 100%; }
  .markdown-body th, .markdown-body td { border: 1px solid #d0d7de; padding: 6px 13px; }
  .markdown-body th { font-weight: 600; background: #f6f8fa; }
  .summary { background: #f6f8fa; border-radius: 8px; padding: 16px; margin: 24px 0; }
  .summary h3 { margin-top: 0; }
  .summary ul { margin: 0; padding-left: 1.5em; }
  .preview-images { margin: 24px 0; }
  .preview-images h3 { margin-top: 24px; margin-bottom: 12px; }
  .preview-images img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 16px; display: block; object-fit: contain; }
  .preview-images .img-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 16px; }
  .preview-images .img-row .img-wrap { width: 300px; flex-shrink: 0; }
  .preview-images .img-row .img-wrap img { width: 100%; height: auto; object-fit: contain; margin-bottom: 0; }
  .preview-images .img-row .img-wrap span { display: block; font-size: 12px; color: #57606a; margin-top: 4px; }
  .badge-note { font-size: 13px; color: #57606a; margin: 8px 0 16px 0; }
  body { max-width: 980px; margin: 0 auto; padding: 45px; }
`;

async function listGeneratedAssets(gitLaunchDir) {
  const assets = [];
  try {
    const entries = await readdir(gitLaunchDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.github') continue;
      if (e.isDirectory()) {
        if (e.name === '.github') {
          assets.push('.github/ (issue & PR templates)');
        } else if (e.name === 'LAUNCH_KIT') {
          const sub = await readdir(join(gitLaunchDir, e.name));
          assets.push(...sub.map(f => `LAUNCH_KIT/${f}`));
        } else if (e.name === 'images') {
          const sub = await readdir(join(gitLaunchDir, e.name));
          assets.push(...sub.map(f => `images/${f}`));
        } else {
          assets.push(`${e.name}/`);
        }
      } else {
        assets.push(e.name);
      }
    }
    assets.sort();
  } catch {
    /* ignore */
  }
  return assets;
}

async function listImageFiles(gitLaunchDir) {
  const imagesDir = join(gitLaunchDir, 'images');
  const result = { social: null, screenshots: [] };
  try {
    const files = await readdir(imagesDir);
    if (files.includes('social-preview.png')) result.social = 'images/social-preview.png';
    for (const name of ['desktop.png', 'tablet.png', 'mobile.png']) {
      if (files.includes(name)) result.screenshots.push({ name, path: `images/${name}` });
    }
  } catch {
    /* ignore */
  }
  return result;
}

async function buildPreview(gitLaunchDir) {
  const readmePath = join(gitLaunchDir, 'README.md');
  let readmeHtml = '<p>No README generated yet.</p>';
  try {
    const readme = await readFile(readmePath, 'utf8');
    readmeHtml = await marked.parse(readme);
  } catch {
    /* use placeholder */
  }

  const assets = await listGeneratedAssets(gitLaunchDir);
  const assetsList = assets.length
    ? assets.map(a => `<li><code>${escapeHtml(a)}</code></li>`).join('')
    : '<li>None yet</li>';

  const imageFiles = await listImageFiles(gitLaunchDir);
  let imagesSection = '';
  if (imageFiles.social || imageFiles.screenshots.length > 0) {
    imagesSection = '<div class="preview-images">';
    if (imageFiles.social) {
      imagesSection += `<h3>Social preview image (1200×630)</h3><img src="${escapeHtml(imageFiles.social)}" alt="Social preview" width="1200">`;
    }
    if (imageFiles.screenshots.length > 0) {
      imagesSection += '<h3>Screenshots</h3><div class="img-row">';
      for (const s of imageFiles.screenshots) {
        const label = s.name.replace('.png', '');
        imagesSection += `<div class="img-wrap"><img src="${escapeHtml(s.path)}" alt="${escapeHtml(label)}"><span>${escapeHtml(label)}</span></div>`;
      }
      imagesSection += '</div>';
    }
    imagesSection += '</div>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https:; script-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'">
  <title>Launch Assets Preview</title>
  <style>${GITHUB_CSS}</style>
</head>
<body>
  <div class="summary">
    <h3>Generated by Git Launcher</h3>
    <p>Preview of launch-ready assets for your project.</p>
    <ul>${assetsList}</ul>
  </div>
  ${imagesSection}
  <p class="badge-note">Project badges (License, Version, Last Commit, tech stack) load from the web — they may appear as text when viewing locally but display correctly on GitHub.</p>
  <div class="markdown-body">${readmeHtml}</div>
</body>
</html>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function main() {
  const args = process.argv.slice(2);
  const projectRoot = resolve(args[0] || join(LAUNCHER_DIR, '..'));
  const projectResolved = resolve(projectRoot);

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const forbidden = ['/', '/etc', '/usr', '/var', '/tmp', '/System', '/Library', home].filter(Boolean);
  if (forbidden.includes(projectResolved)) {
    console.log(JSON.stringify({ success: false, message: `Refusing to use sensitive directory as project root: ${projectResolved}` }));
    process.exit(1);
  }

  const gitLaunchDir = join(projectResolved, 'git-launch');
  const outputPath = join(projectResolved, 'git-launch', 'preview.html');
  if (!outputPath.startsWith(projectResolved)) {
    console.log(JSON.stringify({ success: false, message: 'Output path escapes project root' }));
    process.exit(1);
  }

  // Copy logo to git-launch/assets/ so README's assets/logo.svg loads in preview
  const assetsDir = join(gitLaunchDir, 'assets');
  const logoSources = [
    join(projectRoot, 'production', 'assets', 'logo.svg'),
    join(projectRoot, '.git-launcher', 'assets', 'logo.svg'),
  ];
  for (const logoSource of logoSources) {
    try {
      await access(logoSource);
      await mkdir(assetsDir, { recursive: true });
      await copyFile(logoSource, join(assetsDir, 'logo.svg'));
      break;
    } catch {
      /* try next path */
    }
  }

  const html = await buildPreview(gitLaunchDir);
  await writeFile(outputPath, html, 'utf8');

  const absPath = resolve(outputPath);
  const fileUrl = 'file://' + (process.platform === 'win32' ? '/' : '') + absPath.replace(/\\/g, '/');

  console.log(JSON.stringify({
    success: true,
    previewPath: absPath,
    fileUrl,
  }));
}

main().catch(err => {
  console.log(JSON.stringify({ success: false, message: err.message }));
  process.exit(1);
});
