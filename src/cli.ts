#!/usr/bin/env node
/// <reference types="node" />
import { Command } from 'commander';
import { generateIcons } from './generator.js';

const program = new Command();
program
  .name('react-icon-library')
  .description(
    'Generate reusable React icon components from SVG and raster image files.\n' +
    'Raster images are converted to SVG paths before being generated as React components.\n' +
    'For best quality and smallest output, use original SVG assets when available.',
  ).argument('[input-dir]', 'directory containing image assets', 'icons')
  .option('--max-dimension <number>', 'maximum width/height used during raster tracing')
  .option('--colors <number>', 'maximum number of colors used during raster tracing')
  .option('--path-omit <number>', 'remove traced paths smaller than this threshold')
  .option('--line-tolerance <number>', 'error tolerance for straight lines')
  .option('--curve-tolerance <number>', 'error tolerance for curves')
  .option('--round-coordinates <number>', 'number of decimal places for SVG coordinates')
  .option('-o, --output <directory>', 'output directory for generated components', 'src/icons')
  .option('--no-recursive', 'only read images directly inside the input directory')
  .option('--overwrite', 'replace existing generated component files')
  .action(
    async (
      inputDir: string,
      options: {
        output: string;
        recursive: boolean;
        overwrite?: boolean;
        maxDimension?: string;
        colors?: string;
        pathOmit?: string;
        lineTolerance?: string;
        curveTolerance?: string;
        roundCoordinates?: string;
      },
    ) => {
      try {
        const result = await generateIcons({
          inputDir,
          outputDir: options.output,
          recursive: options.recursive,
          ...(options.overwrite === undefined
            ? {}
            : { overwrite: options.overwrite }),

          vectorize: {
            ...(options.maxDimension ? { maxDimension: Number(options.maxDimension) } : {}),
            ...(options.colors ? { numberOfColors: Number(options.colors) } : {}),
            ...(options.pathOmit ? { pathOmit: Number(options.pathOmit) } : {}),
            ...(options.lineTolerance ? { lineTolerance: Number(options.lineTolerance) } : {}),
            ...(options.curveTolerance ? { curveTolerance: Number(options.curveTolerance) } : {}),
            ...(options.roundCoordinates ? { roundCoordinates: Number(options.roundCoordinates) } : {}),
          },
        });

        if (result.warnings.length > 0) {
          console.log('\n⚠️  [Asset Quality Notices]');
          for (const warning of result.warnings) {
            console.warn(`   • ${warning}`);
          }
          console.log('');
        }

        console.log(`Generated ${result.icons.length} React icon(s) in ${result.outputDir}`);
        for (const icon of result.icons) console.log(`  ${icon.name}  <-  ${icon.source}`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      }
    });

program.parseAsync();