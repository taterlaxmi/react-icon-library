import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { transform } from '@svgr/core';
import { rasterToSvg, type VectorizeOptions, } from './vectorizer.js';

const RASTER_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
]);
const VECTOR_EXTENSIONS = new Set(['.svg']);
const SVG_WARNING_SIZE_BYTES = 50 * 1024;
const SVG_WARNING_PATH_COUNT = 30;

export interface GenerateIconsOptions {
  inputDir: string;
  outputDir: string;
  recursive?: boolean;
  overwrite?: boolean;

  /**
   * Options used when converting raster images into SVG.
   */
  vectorize?: VectorizeOptions;
}

export interface GeneratedIcon {
  name: string;
  source: string;
  componentFile: string;
}

export interface GenerateIconsResult {
  icons: GeneratedIcon[];
  outputDir: string;
  /** Non-fatal warnings produced during generation (e.g. large raster files). */
  warnings: string[];
}

interface SourceAsset {
  path: string;
  name: string;
  extension: string;
}

function componentName(filePath: string): string {
  const baseName = path.basename(filePath, path.extname(filePath));
  const words = baseName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .match(/[A-Za-z0-9]+/g);
  const name = (words ?? []).map((word) => word[0]!.toUpperCase() + word.slice(1)).join('');
  const safeName = /^[A-Za-z_$]/.test(name) ? name : `Icon${name}`;
  return safeName || 'Icon';
}

function isWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function findAssets(inputDir: string, outputDir: string, recursive: boolean): Promise<SourceAsset[]> {
  const assets: SourceAsset[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (recursive && !(directory === inputDir && isWithin(fullPath, outputDir))) await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (VECTOR_EXTENSIONS.has(extension) || RASTER_EXTENSIONS.has(extension)) {
        assets.push({ path: fullPath, name: componentName(fullPath), extension });
      }
    }
  }

  await visit(inputDir);
  return assets;
}


interface RasterComponentResult {
  contents: string;
  svgSizeBytes: number;
  pathCount: number;
  sourceWidth: number;
  sourceHeight: number;
  tracedWidth: number;
  tracedHeight: number;
}

async function rasterComponent(
  asset: SourceAsset,
  component: string,
  vectorizeOptions?: VectorizeOptions,
): Promise<RasterComponentResult> {
  try {
    const result = await rasterToSvg(asset.path, vectorizeOptions);

    const contents = await transform(
      result.svg,
      {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        typescript: true,
        jsxRuntime: 'automatic',
        icon: true,
        titleProp: true,
        exportType: 'default',
        prettier: false,
      },
      {
        componentName: component,
      },
    );

    const pathCount = (result.svg.match(/<path\b/g) ?? []).length;

    return {
      contents,
      svgSizeBytes: Buffer.byteLength(result.svg, 'utf8'),
      pathCount,
      sourceWidth: result.sourceWidth,
      sourceHeight: result.sourceHeight,
      tracedWidth: result.tracedWidth,
      tracedHeight: result.tracedHeight,
    };
  } catch (error) {
    throw new Error(
      `Cannot vectorize raster image "${asset.path}": ${errorMessage(error)}`,
    );
  }
}

async function svgComponent(asset: SourceAsset, component: string): Promise<string> {
  const source = await readFile(asset.path, 'utf8');
  try {
    return await transform(source, {
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      typescript: true,
      jsxRuntime: 'automatic',
      icon: true,
      titleProp: true,
      exportType: 'default',
      prettier: false,
    }, { componentName: component });
  } catch (error) {
    throw new Error(`Cannot convert SVG "${asset.path}": ${errorMessage(error)}`);
  }
}

export async function generateIcons(options: GenerateIconsOptions): Promise<GenerateIconsResult> {
  const inputDir = path.resolve(options.inputDir);
  const outputDir = path.resolve(options.outputDir);
  const recursive = options.recursive ?? true;
  const overwrite = options.overwrite ?? false;

  let inputStat;
  try {
    inputStat = await stat(inputDir);
  } catch {
    throw new Error(`Input directory does not exist: "${inputDir}"`);
  }
  if (!inputStat.isDirectory()) throw new Error(`Input path is not a directory: "${inputDir}"`);

  const assets = await findAssets(inputDir, outputDir, recursive);
  if (assets.length === 0) throw new Error(`No supported image assets found in "${inputDir}".`);

  const names = new Map<string, string>();
  for (const asset of assets) {
    const normalizedName = asset.name.toLocaleLowerCase('en-US');
    const previous = names.get(normalizedName);
    if (previous) {
      throw new Error(`Name collision: "${previous}" and "${asset.path}" both generate the component "${asset.name}". Rename one of the source files.`);
    }
    names.set(normalizedName, asset.path);
  }

  const warnings: string[] = [];
  const converted = await Promise.all(
    assets.map(async (asset) => {
      if (VECTOR_EXTENSIONS.has(asset.extension)) {
        return {
          asset,
          contents: await svgComponent(asset, asset.name),
        };
      }

      const result = await rasterComponent(
        asset,
        asset.name,
        options.vectorize,
      );

      return {
        asset,
        contents: result.contents,
        svgSizeBytes: result.svgSizeBytes,
        pathCount: result.pathCount,
        sourceWidth: result.sourceWidth,
        sourceHeight: result.sourceHeight,
        tracedWidth: result.tracedWidth,
        tracedHeight: result.tracedHeight,
      };
    }),
  );

  for (const item of converted) {
    if (!item.svgSizeBytes || !item.pathCount) {
      continue;
    }

    if (item.svgSizeBytes > SVG_WARNING_SIZE_BYTES) {
      warnings.push(
        `Icon "${item.asset.name}" generated a large SVG ` +
        `(${Math.round(item.svgSizeBytes / 1024)} KB). ` +
        `Consider using the original SVG or reducing tracing complexity.`,
      );
    }

    if (item.pathCount > SVG_WARNING_PATH_COUNT) {
      warnings.push(
        `Icon "${item.asset.name}" generated a complex SVG ` +
        `(${item.pathCount} paths). ` +
        `Consider reducing colors or increasing path omission.`,
      );
    }
  }

  // Re-export the default component and derive its Props type using React's ComponentProps utility
  const indexContents = `${converted.map(({ asset }) =>
    `export { default as ${asset.name} } from './${asset.name}.js';\n` +
    `export type ${asset.name}Props = import('react').ComponentProps<typeof import('./${asset.name}.js').default>;`,
  ).join('\n')}\n`;

  const outputs = [
    ...converted.map(({ asset, contents }) => ({ filePath: path.join(outputDir, `${asset.name}.tsx`), contents })),
    { filePath: path.join(outputDir, 'index.ts'), contents: indexContents },
  ];

  if (!overwrite) {
    const conflicts: string[] = [];
    for (const output of outputs) {
      try {
        await access(output.filePath);
        conflicts.push(output.filePath);
      } catch {
        // A missing destination is expected for a fresh generation.
      }
    }
    if (conflicts.length) throw new Error(`Refusing to overwrite existing generated file(s): ${conflicts.join(', ')}. Use --overwrite to replace them.`);
  }

  await mkdir(outputDir, { recursive: true });
  for (const output of outputs) {
    const temporaryPath = `${output.filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, output.contents, 'utf8');
      if (overwrite) await rm(output.filePath, { force: true });
      await rename(temporaryPath, output.filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw new Error(`Failed to write "${output.filePath}": ${errorMessage(error)}`);
    }
  }

  return {
    icons: converted.map(({ asset }) => ({
      name: asset.name,
      source: path.relative(inputDir, asset.path),
      componentFile: path.join(outputDir, `${asset.name}.tsx`),
    })),
    outputDir,
    warnings,
  };
}
