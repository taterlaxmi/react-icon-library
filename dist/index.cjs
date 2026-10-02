"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  generateIcons: () => generateIcons
});
module.exports = __toCommonJS(index_exports);
var import_promises = require("fs/promises");
var import_node_path = __toESM(require("path"), 1);
var import_node_crypto = require("crypto");
var import_image_size = require("image-size");
var import_core = require("@svgr/core");
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
  const baseName = import_node_path.default.basename(filePath, import_node_path.default.extname(filePath));
  const words = baseName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").match(/[A-Za-z0-9]+/g);
  const name = (words ?? []).map((word) => word[0].toUpperCase() + word.slice(1)).join("");
  const safeName = /^[A-Za-z_$]/.test(name) ? name : `Icon${name}`;
  return safeName || "Icon";
}
function isWithin(parent, child) {
  const relative = import_node_path.default.relative(parent, child);
  return relative === "" || !relative.startsWith(`..${import_node_path.default.sep}`) && relative !== ".." && !import_node_path.default.isAbsolute(relative);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
async function findAssets(inputDir, outputDir, recursive) {
  const assets = [];
  async function visit(directory) {
    const entries = await (0, import_promises.readdir)(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = import_node_path.default.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (recursive && !(directory === inputDir && isWithin(fullPath, outputDir))) await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = import_node_path.default.extname(entry.name).toLowerCase();
      if (VECTOR_EXTENSIONS.has(extension) || extension in RASTER_MIME_TYPES) {
        assets.push({ path: fullPath, name: componentName(fullPath), extension });
      }
    }
  }
  await visit(inputDir);
  return assets;
}
async function rasterComponent(asset, component) {
  const bytes = await (0, import_promises.readFile)(asset.path);
  let dimensions;
  try {
    dimensions = (0, import_image_size.imageSize)(bytes);
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
  const source = await (0, import_promises.readFile)(asset.path, "utf8");
  try {
    return await (0, import_core.transform)(source, {
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
  const inputDir = import_node_path.default.resolve(options.inputDir);
  const outputDir = import_node_path.default.resolve(options.outputDir);
  const recursive = options.recursive ?? true;
  const overwrite = options.overwrite ?? false;
  let inputStat;
  try {
    inputStat = await (0, import_promises.stat)(inputDir);
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
    ...converted.map(({ asset, contents }) => ({ filePath: import_node_path.default.join(outputDir, `${asset.name}.tsx`), contents })),
    { filePath: import_node_path.default.join(outputDir, "index.ts"), contents: indexContents }
  ];
  if (!overwrite) {
    const conflicts = [];
    for (const output of outputs) {
      try {
        await (0, import_promises.access)(output.filePath);
        conflicts.push(output.filePath);
      } catch {
      }
    }
    if (conflicts.length) throw new Error(`Refusing to overwrite existing generated file(s): ${conflicts.join(", ")}. Use --overwrite to replace them.`);
  }
  await (0, import_promises.mkdir)(outputDir, { recursive: true });
  for (const output of outputs) {
    const temporaryPath = `${output.filePath}.${(0, import_node_crypto.randomUUID)()}.tmp`;
    try {
      await (0, import_promises.writeFile)(temporaryPath, output.contents, "utf8");
      if (overwrite) await (0, import_promises.rm)(output.filePath, { force: true });
      await (0, import_promises.rename)(temporaryPath, output.filePath);
    } catch (error) {
      await (0, import_promises.rm)(temporaryPath, { force: true });
      throw new Error(`Failed to write "${output.filePath}": ${errorMessage(error)}`);
    }
  }
  return {
    icons: converted.map(({ asset }) => ({
      name: asset.name,
      source: import_node_path.default.relative(inputDir, asset.path),
      componentFile: import_node_path.default.join(outputDir, `${asset.name}.tsx`)
    })),
    outputDir
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateIcons
});
//# sourceMappingURL=index.cjs.map