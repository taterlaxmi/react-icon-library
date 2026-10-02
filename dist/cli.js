#!/usr/bin/env node
import {
  generateIcons
} from "./chunk-N5DDYT6F.js";

// src/cli.ts
import { Command } from "commander";
var program = new Command();
program.name("react-icon-library").description("Generate reusable React icon components from SVG and raster image files.").argument("[input-dir]", "directory containing image assets", "icons").option("-o, --output <directory>", "output directory for generated components", "src/icons").option("--no-recursive", "only read images directly inside the input directory").option("--overwrite", "replace existing generated component files").action(async (inputDir, options) => {
  try {
    const result = await generateIcons({
      inputDir,
      outputDir: options.output,
      recursive: options.recursive,
      ...options.overwrite === void 0 ? {} : { overwrite: options.overwrite }
    });
    console.log(`Generated ${result.icons.length} React icon(s) in ${result.outputDir}`);
    for (const icon of result.icons) console.log(`  ${icon.name}  \u2190  ${icon.source}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
});
program.parseAsync();
//# sourceMappingURL=cli.js.map