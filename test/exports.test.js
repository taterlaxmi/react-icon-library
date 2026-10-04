import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// // ---------------------------------------------------------------------------
// // Minimal 1x1 PNG (valid binary, tiny — avoids bloating the test output)
// // ---------------------------------------------------------------------------
// const TINY_PNG_BASE64 =
//   'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
// const TINY_PNG = Buffer.from(TINY_PNG_BASE64, 'base64');

// // Minimal valid SVG
// const TINY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>';

// // ---------------------------------------------------------------------------
// // Icons (pre-built, browser-safe entry)
// // ---------------------------------------------------------------------------
// test('package root exports pre-built icon components', async () => {
//   const { Drinkprime, Kiwi, Zepto } = await import('../dist/index.js');
//   assert.equal(typeof Kiwi, 'function', 'Kiwi should be a React component');
//   assert.equal(typeof Drinkprime, 'function', 'Drinkprime should be a React component');
//   assert.equal(typeof Zepto, 'function', 'Zepto should be a React component');
// });

// test('package root does NOT export generateIcons (Node.js only)', async () => {
//   const icons = await import('../dist/index.js');
//   assert.equal(
//     'generateIcons' in icons,
//     false,
//     'generateIcons must not be in the browser-safe entry — import from /generator instead',
//   );
// });

// // ---------------------------------------------------------------------------
// // Generator API (Node.js-only entry)
// // ---------------------------------------------------------------------------
// test('generator sub-path exports generateIcons', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   assert.equal(typeof generateIcons, 'function');
// });

// test('generateIcons: throws when input directory does not exist', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   await assert.rejects(
//     () => generateIcons({ inputDir: './does-not-exist-ever', outputDir: './out' }),
//     /Input directory does not exist/,
//   );
// });

// test('generateIcons: throws when input path is not a directory', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     const filePath = path.join(tmp, 'not-a-dir.png');
//     await writeFile(filePath, TINY_PNG);
//     await assert.rejects(
//       () => generateIcons({ inputDir: filePath, outputDir: path.join(tmp, 'out') }),
//       /Input path is not a directory/,
//     );
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: throws when no supported assets are found', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'readme.txt'), 'not an image');
//     await assert.rejects(
//       () => generateIcons({ inputDir: tmp, outputDir: path.join(tmp, 'out') }),
//       /No supported image assets found/,
//     );
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: generates a .tsx component and index.ts from a PNG', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
//     const outputDir = path.join(tmp, 'out');
//     const result = await generateIcons({ inputDir: tmp, outputDir });

//     assert.equal(result.icons.length, 1);
//     assert.equal(result.icons[0]?.name, 'Logo');
//     assert.equal(result.icons[0]?.source, 'logo.png');

//     const component = await readFile(path.join(outputDir, 'Logo.tsx'), 'utf8');
//     assert.ok(component.includes('export default function Logo('), 'component should have a named function');
//     assert.ok(component.includes('export interface LogoProps'), 'Props interface should be exported');
//     assert.ok(component.includes('data:image/png;base64,'), 'raster component should embed data URI');

//     const index = await readFile(path.join(outputDir, 'index.ts'), 'utf8');
//     assert.ok(index.includes("export { default as Logo, type LogoProps }"), 'barrel should re-export Props type');
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: generates a .tsx component from an SVG', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'icon.svg'), TINY_SVG);
//     const outputDir = path.join(tmp, 'out');
//     const result = await generateIcons({ inputDir: tmp, outputDir });

//     assert.equal(result.icons.length, 1);
//     assert.equal(result.icons[0]?.name, 'Icon');

//     const component = await readFile(path.join(outputDir, 'Icon.tsx'), 'utf8');
//     // SVGR should produce inline JSX, not a data URI
//     assert.ok(!component.includes('data:image/'), 'SVG component should NOT embed a data URI');
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: refuses to overwrite without --overwrite flag', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
//     const outputDir = path.join(tmp, 'out');
//     await generateIcons({ inputDir: tmp, outputDir });
//     // Second run without overwrite should fail
//     await assert.rejects(
//       () => generateIcons({ inputDir: tmp, outputDir }),
//       /Refusing to overwrite/,
//     );
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: overwrites when overwrite: true', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
//     const outputDir = path.join(tmp, 'out');
//     await generateIcons({ inputDir: tmp, outputDir });
//     // Should not throw
//     await generateIcons({ inputDir: tmp, outputDir, overwrite: true });
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: detects name collisions across extensions', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
//     await writeFile(path.join(tmp, 'logo.svg'), TINY_SVG);
//     await assert.rejects(
//       () => generateIcons({ inputDir: tmp, outputDir: path.join(tmp, 'out') }),
//       /Name collision/,
//     );
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: warns when raster file exceeds size threshold', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     // Write a small-but-valid PNG for the structure test.
//     // We'll check that the warnings field exists and is an array.
//     await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
//     const result = await generateIcons({ inputDir: tmp, outputDir: path.join(tmp, 'out') });
//     // Tiny 1x1 PNG won't trigger the warning, but the field should always exist.
//     assert.ok(Array.isArray(result.warnings), 'result.warnings should always be an array');
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });

// test('generateIcons: component name derived correctly from file basename', async () => {
//   const { generateIcons } = await import('../dist/generator.js');
//   const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));
//   try {
//     await writeFile(path.join(tmp, 'drink-prime_v2.png'), TINY_PNG);
//     const result = await generateIcons({ inputDir: tmp, outputDir: path.join(tmp, 'out') });
//     assert.equal(result.icons[0]?.name, 'DrinkPrimeV2');
//   } finally {
//     await rm(tmp, { recursive: true, force: true });
//   }
// });