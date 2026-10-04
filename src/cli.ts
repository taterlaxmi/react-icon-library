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
  .option(
    '--max-dimension <number>',
    'maximum width/height used during raster tracing',
    '512',
  )
  .option(
    '--colors <number>',
    'maximum number of colors used during raster tracing',
    '16',
  )
  .option(
    '--path-omit <number>',
    'remove traced paths smaller than this threshold',
    '8',
  )
  .option(
    '--line-tolerance <number>',
    'error tolerance for straight lines',
    '1',
  )
  .option(
    '--curve-tolerance <number>',
    'error tolerance for curves',
    '1',
  )
  .option(
    '--round-coordinates <number>',
    'number of decimal places for SVG coordinates',
    '1',
  )
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
        maxDimension: string;
        colors: string;
        pathOmit: string;
        lineTolerance: string;
        curveTolerance: string;
        roundCoordinates: string;
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
            maxDimension: Number(options.maxDimension),
            numberOfColors: Number(options.colors),
            pathOmit: Number(options.pathOmit),
            lineTolerance: Number(options.lineTolerance),
            curveTolerance: Number(options.curveTolerance),
            roundCoordinates: Number(options.roundCoordinates),
          },
        }); for (const warning of result.warnings) {
          console.warn(`Warning: ${warning}`);
        }
        console.log(`Generated ${result.icons.length} React icon(s) in ${result.outputDir}`);
        for (const icon of result.icons) console.log(`  ${icon.name}  <-  ${icon.source}`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      }
    });

program.parseAsync();