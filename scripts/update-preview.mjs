import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'src', 'icons');
const ASSETS_DIR = path.join(ROOT_DIR, 'brand-assets');
const PREVIEW_FILE = path.join(ROOT_DIR, 'preview.html');

function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function updatePreview() {
  const entries = await readdir(ICONS_DIR, { withFileTypes: true });
  const iconFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
    .map((e) => e.name)
    .sort();

  if (iconFiles.length === 0) {
    console.log('No icons found in src/icons to update preview.');
    return;
  }

  // Load brand assets for quality analysis
  let assetFiles = [];
  try {
    const rawAssets = await readdir(ASSETS_DIR, { withFileTypes: true });
    assetFiles = rawAssets.filter((a) => a.isFile()).map((a) => a.name);
  } catch {
    // If brand-assets missing, continue
  }

  const iconsData = [];

  for (const file of iconFiles) {
    const fullPath = path.join(ICONS_DIR, file);
    const content = await readFile(fullPath, 'utf8');
    const fileStat = await stat(fullPath);
    const name = path.basename(file, '.tsx');
    const id = `svg-${name.toLowerCase()}`;

    // Extract viewBox
    const viewBoxMatch = content.match(/createIcon\(\s*['"][^'"]+['"],\s*['"]([^'"]+)['"]/);
    const viewBox = viewBoxMatch?.[1] ?? '0 0 24 24';
    const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
    const aspectRatio = (vbWidth && vbHeight) ? (vbWidth / vbHeight) : 1;

    // Extract SVG inner elements
    const renderContentMatch = content.match(/createIcon\([^,]+,\s*[^,]+,\s*\(props\)\s*=>\s*\([\s\S]*?\(([\s\S]*?)\)\s*\)\s*\);/);
    let innerSvg = '';
    if (renderContentMatch?.[1]) {
      innerSvg = renderContentMatch[1].trim();
    } else {
      // Fallback: look for fragment or elements
      const fragMatch = content.match(/<>\s*([\s\S]*?)\s*<\/>/);
      if (fragMatch?.[1]) {
        innerSvg = fragMatch[1].trim();
      } else {
        const pathMatch = content.match(/<path[\s\S]*?\/>/g);
        innerSvg = (pathMatch ?? []).join('\n');
      }
    }

    // Convert JSX props.color to static SVG fill and clean JSX attributes to HTML5 SVG
    innerSvg = innerSvg
      .replace(/fill=\{props\.color\s*\?\?\s*['"]([^'"]+)['"]\}/g, 'fill="$1"')
      .replace(/opacity=\{([^}]+)\}/g, 'opacity="$1"')
      .replace(/fillRule="evenodd"/g, 'fill-rule="evenodd"')
      .replace(/clipRule="evenodd"/g, 'clip-rule="evenodd"')
      .replace(/strokeWidth=\{([^}]+)\}/g, 'stroke-width="$1"')
      .replace(/strokeLinecap="([^"]+)"/g, 'stroke-linecap="$1"')
      .replace(/strokeLinejoin="([^"]+)"/g, 'stroke-linejoin="$1"')
      .replace(/([a-zA-Z0-9_-]+)=\{([0-9.-]+)\}/g, '$1="$2"');

    // Extract primary brand color (prefer vibrant colors over neutral whites/blacks)
    const colorMatches = [...content.matchAll(/props\.color\s*\?\?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    let brandColor = colorMatches[0] ?? '#3b82f6';
    for (const c of colorMatches) {
      if (c && !['#ffffff', '#fff', '#fcf9fd', '#000000', '#000'].includes(c.toLowerCase())) {
        brandColor = c;
        break;
      }
    }

    const sizeKb = (fileStat.size / 1024).toFixed(1);

    // Analyze matching source asset for quality metrics
    const matchingAsset = assetFiles.find((a) => {
      const base = path.basename(a, path.extname(a));
      return normalizeName(base) === normalizeName(name);
    });

    let isPristineSvg = false;
    let issues = [];
    let formatLabel = 'Vector';

    if (matchingAsset) {
      const ext = path.extname(matchingAsset).toLowerCase();
      const assetPath = path.join(ASSETS_DIR, matchingAsset);

      if (ext === '.svg') {
        isPristineSvg = true;
        formatLabel = 'SVG';
      } else {
        formatLabel = ext.replace('.', '').toUpperCase();
        try {
          const meta = await sharp(assetPath).metadata();
          if (ext === '.jpg' || ext === '.jpeg') {
            issues.push('Lossy JPEG format (edge compression halos)');
          }
          if (meta.width && meta.height) {
            if (meta.width < 400 || meta.height < 120) {
              issues.push(`Low source resolution (${meta.width}x${meta.height}px)`);
            }
            const ratio = meta.width / meta.height;
            if (ratio > 2.8) {
              issues.push(`Wide banner wordmark (${ratio.toFixed(1)}:1 aspect ratio)`);
            }
          }
        } catch {
          // Metadata read failed
        }
      }
    }

    if (Number(sizeKb) > 20) {
      issues.push(`Large SVG size (${sizeKb} KB)`);
    }

    iconsData.push({
      name,
      id,
      viewBox,
      aspectRatio,
      innerSvg,
      brandColor,
      sizeKb,
      isPristineSvg,
      formatLabel,
      issues,
    });
  }

  // Generate icon cards HTML
  const cardsHtml = iconsData.map((icon) => {
    const stageWidth = Math.round(48 * icon.aspectRatio);

    let tagClass = 'icon-tag tag-good';
    let tagText = `${icon.sizeKb} KB • ${icon.formatLabel}`;
    let noticeHtml = '';

    if (icon.isPristineSvg) {
      tagClass = 'icon-tag tag-pristine';
      tagText = `✓ ${icon.sizeKb} KB • SVG Vector`;
    } else if (icon.issues.length > 0) {
      tagClass = 'icon-tag tag-warning';
      tagText = `⚠️ ${icon.sizeKb} KB • Notice`;
      noticeHtml = `
          <div class="card-notice">
            <strong>⚠️ Quality Advisory:</strong> ${icon.issues.join(' • ')}
            <span class="notice-tip">💡 Upgrade Tip: Replace with an 800px+ square brand emblem or official SVG for pixel-perfect curves.</span>
          </div>`;
    }

    const scales = [16, 24, 32, 48].map((s) => {
      const sw = Math.round(s * icon.aspectRatio);
      return `
            <div class="scale-item">
              <span class="scale-label">${s}px</span>
              <svg width="${sw}" height="${s}" viewBox="${icon.viewBox}">${icon.innerSvg}</svg>
            </div>`;
    }).join('');

    return `
      <!-- ${icon.name} Card -->
      <div class="icon-card" id="card-${icon.name.toLowerCase()}">
        <div class="icon-preview-stage checkerboard">
          <div class="icon-svg-wrapper" id="svg-wrap-${icon.name.toLowerCase()}">
            <svg id="${icon.id}" width="${stageWidth}" height="48" viewBox="${icon.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
              ${icon.innerSvg}
            </svg>
          </div>
        </div>
        <div class="icon-card-body">
          <div class="card-meta-row">
            <span class="icon-name">&lt;${icon.name} /&gt;</span>
            <span class="${tagClass}">${tagText}</span>
          </div>
          ${noticeHtml}
          <!-- Quick Scale Preview -->
          <div class="scales-row">
            ${scales}
          </div>
          <div class="card-actions">
            <button class="btn btn-action" onclick="copyJsx('<${icon.name} />')">Copy JSX</button>
            <button class="btn btn-action" onclick="copySvg('${icon.id}')">Copy SVG</button>
          </div>
        </div>
      </div>`;
  }).join('\n');

  // Read preview.html template
  let preview = await readFile(PREVIEW_FILE, 'utf8');

  // Replace cards grid
  const gridStart = '<div class="icon-grid">';
  const gridEnd = '</div>\n\n    <!-- Quality Benchmark Section -->';
  const startIndex = preview.indexOf(gridStart);
  const endIndex = preview.indexOf(gridEnd);

  if (startIndex !== -1 && endIndex !== -1) {
    preview = preview.slice(0, startIndex + gridStart.length) +
      '\n' + cardsHtml + '\n    ' +
      preview.slice(endIndex);
  }

  // Update defaultColors in JavaScript
  const defaultColorsObject = iconsData.reduce((acc, icon) => {
    acc[icon.id] = icon.brandColor;
    return acc;
  }, {});

  const colorsJs = `    const defaultColors = ${JSON.stringify(defaultColorsObject, null, 6)};`;
  preview = preview.replace(
    /const defaultColors = \{[\s\S]*?\};/,
    colorsJs.trim(),
  );

  // Update IDs array in color switcher
  const idsArray = JSON.stringify(iconsData.map((i) => i.id));
  preview = preview.replace(
    /\[\s*'svg-[\s\S]*?\]\.forEach\(id => \{/,
    `${idsArray}.forEach(id => {`,
  );

  // Update subtitle brand names
  const brandList = iconsData.map((i) => `<strong>${i.name}</strong>`).join(', ');
  preview = preview.replace(
    /<p class="subtitle">[\s\S]*?<\/p>/,
    `<p class="subtitle">\n        Visual quality validator and gallery for ${brandList}.\n        Every icon is engineered with pristine mathematical vector bezier curves, transparent backgrounds, and responsive sizing.\n      </p>`,
  );

  await writeFile(PREVIEW_FILE, preview, 'utf8');
  console.log(`[Preview] Updated preview.html with ${iconsData.length} icons: ${iconsData.map((i) => i.name).join(', ')}`);
}

// Run if called directly
if (process.argv[1]?.endsWith('update-preview.mjs')) {
  updatePreview().catch((err) => {
    console.error('Failed to update preview:', err);
    process.exitCode = 1;
  });
}
