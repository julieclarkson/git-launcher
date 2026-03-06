import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    title: 'My Project',
    subtitle: '',
    color: '#3B82F6',
    tech: '',
    logo: '',
    output: 'git-launch/images/social-preview.png',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) { opts.title = args[i + 1]; i++; }
    else if (args[i] === '--subtitle' && args[i + 1]) { opts.subtitle = args[i + 1]; i++; }
    else if (args[i] === '--color' && args[i + 1]) { opts.color = args[i + 1]; i++; }
    else if (args[i] === '--tech' && args[i + 1]) { opts.tech = args[i + 1]; i++; }
    else if (args[i] === '--logo' && args[i + 1]) { opts.logo = args[i + 1]; i++; }
    else if (args[i] === '--output' && args[i + 1]) { opts.output = args[i + 1]; i++; }
  }

  return opts;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function computeSRI(content) {
  const hash = createHash('sha384').update(content).digest('base64');
  return `sha384-${hash}`;
}

function validateColor(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}. Must be #RRGGBB format.`);
  }
  return hex;
}

function darkenColor(hex, amount = 0.4) {
  hex = validateColor(hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

function buildSVG(opts, logoDataUri = null) {
  validateColor(opts.color);
  const dark = darkenColor(opts.color);
  const title = escapeXml(opts.title);
  const subtitle = escapeXml(opts.subtitle);
  const tech = escapeXml(opts.tech);

  const titleSize = title.length > 25 ? 52 : 64;

  const logoY = 50;
  const logoSize = 100;
  const logoX = (1200 - logoSize) / 2;
  const titleY = logoDataUri ? 200 : 260;
  const subtitleY = logoDataUri ? 270 : 330;
  const dividerY = logoDataUri ? 310 : 370;
  const techY = logoDataUri ? 460 : 520;

  const logoImg = logoDataUri
    ? `<image href="${logoDataUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${opts.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${dark};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  ${logoImg}
  <text x="600" y="${titleY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="white">${title}</text>
  <text x="600" y="${subtitleY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="28" fill="white" opacity="0.85">${subtitle}</text>
  ${tech ? `<text x="600" y="${techY}" text-anchor="middle" font-family="monospace" font-size="18" fill="white" opacity="0.6">${tech}</text>` : ''}
  <rect x="540" y="${dividerY}" width="120" height="4" rx="2" fill="white" opacity="0.3" />
</svg>`;
}

function validateOutputPath(outputPath) {
  const cwd = resolve(process.cwd());
  const resolved = resolve(outputPath);
  if (!resolved.startsWith(cwd)) {
    throw new Error(`Output path must be inside the project directory. Got: ${resolved}`);
  }
  return resolved;
}

async function run() {
  const opts = parseArgs(process.argv);

  const safePath = validateOutputPath(opts.output);
  opts.output = safePath;
  await mkdir(dirname(opts.output), { recursive: true });

  let logoDataUri = null;
  if (opts.logo) {
    try {
      const cwd = resolve(process.cwd());
      const logoPath = resolve(opts.logo);
      if (!logoPath.startsWith(cwd)) {
        throw new Error(`Logo path must be inside project directory. Got: ${logoPath}`);
      }
      const logoBuf = await readFile(logoPath);
      const b64 = logoBuf.toString('base64');
      const mime = logoPath.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      logoDataUri = `data:${mime};base64,${b64}`;
    } catch {
      /* logo optional, continue without */
    }
  }

  const svg = buildSVG(opts, logoDataUri);

  let usedSharp = false;
  try {
    const sharp = (await import('sharp')).default;
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(opts.output, pngBuffer);
    usedSharp = true;
  } catch {
    const svgPath = opts.output.replace(/\.png$/, '.svg');
    await writeFile(svgPath, svg, 'utf8');
    console.log(JSON.stringify({
      success: true,
      format: 'svg',
      path: svgPath,
      note: 'sharp not available — generated SVG fallback. Upload this to GitHub as social preview.',
    }));
    return;
  }

  console.log(JSON.stringify({
    success: true,
    format: 'png',
    path: opts.output,
    dimensions: { width: 1200, height: 630 },
  }));
}

run().catch(err => {
  console.log(JSON.stringify({ success: false, message: err.message }));
  process.exit(1);
});
