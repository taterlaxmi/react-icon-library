// src/index.ts
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { imageSize } from "image-size";
import { transform } from "@svgr/core";
var RASTER_MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif"
};
var VECTOR_EXTENSIONS = /* @__PURE__ */ new Set([".svg"]);
function componentName(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const words = baseName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").match(/[A-Za-z0-9]+/g);
  const name = (words ?? []).map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  const safeName = /^[A-Za-z_$]/.test(name) ? name : `Icon${name}`;
  return safeName || "Icon";
}
function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
async function findAssets(inputDir, outputDir, recursive) {
  const assets = [];
  async function visit(directory) {
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
      if (VECTOR_EXTENSIONS.has(extension) || extension in RASTER_MIME_TYPES) {
        assets.push({ path: fullPath, name: componentName(fullPath), extension });
      }
    }
  }
  await visit(inputDir);
  return assets;
}
async function rasterComponent(asset, component) {
  const bytes = await readFile(asset.path);
  let dimensions;
  try {
    dimensions = imageSize(bytes);
  } catch (error) {
    throw new Error(`Cannot read image dimensions for "${asset.path}": ${errorMessage(error)}`);
  }
  if (!dimensions.width || !dimensions.height) throw new Error(`Image "${asset.path}" does not have valid dimensions.`);
  const dataUri = `data:${RASTER_MIME_TYPES[asset.extension]};base64,${bytes.toString("base64")}`;
  return `import type { SVGProps } from 'react';

export interface ${component}Props extends SVGProps<SVGSVGElement> {
  /** Accessible label. Omit for a decorative icon. */
  title?: string;
}

const imageSource = ${JSON.stringify(dataUri)};

export default function ${component}({ title, width, height, ...props }: ${component}Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${dimensions.width} ${dimensions.height}"
      width={width ?? '1em'}
      height={height ?? '1em'}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <image href={imageSource} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
`;
}
async function svgComponent(asset, component) {
  const source = await readFile(asset.path, "utf8");
  try {
    return await transform(source, {
      plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
      typescript: true,
      jsxRuntime: "automatic",
      icon: true,
      titleProp: true,
      exportType: "default",
      prettier: false
    }, { componentName: component });
  } catch (error) {
    throw new Error(`Cannot convert SVG "${asset.path}": ${errorMessage(error)}`);
  }
}
async function generateIcons(options) {
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
  const names = /* @__PURE__ */ new Map();
  for (const asset of assets) {
    const normalizedName = asset.name.toLocaleLowerCase("en-US");
    const previous = names.get(normalizedName);
    if (previous) {
      throw new Error(`Name collision: "${previous}" and "${asset.path}" both generate the component "${asset.name}". Rename one of the source files.`);
    }
    names.set(normalizedName, asset.path);
  }
  const converted = await Promise.all(assets.map(async (asset) => ({
    asset,
    contents: VECTOR_EXTENSIONS.has(asset.extension) ? await svgComponent(asset, asset.name) : await rasterComponent(asset, asset.name)
  })));
  const indexContents = `${converted.map(({ asset }) => `export { default as ${asset.name} } from './${asset.name}.js';`).join("\n")}
`;
  const outputs = [
    ...converted.map(({ asset, contents }) => ({ filePath: path.join(outputDir, `${asset.name}.tsx`), contents })),
    { filePath: path.join(outputDir, "index.ts"), contents: indexContents }
  ];
  if (!overwrite) {
    const conflicts = [];
    for (const output of outputs) {
      try {
        await access(output.filePath);
        conflicts.push(output.filePath);
      } catch {
      }
    }
    if (conflicts.length) throw new Error(`Refusing to overwrite existing generated file(s): ${conflicts.join(", ")}. Use --overwrite to replace them.`);
  }
  await mkdir(outputDir, { recursive: true });
  for (const output of outputs) {
    const temporaryPath = `${output.filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, output.contents, "utf8");
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
      componentFile: path.join(outputDir, `${asset.name}.tsx`)
    })),
    outputDir
  };
}

export {
  generateIcons
};
//# sourceMappingURL=chunk-N5DDYT6F.js.map