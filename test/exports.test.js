import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Minimal test assets
// ---------------------------------------------------------------------------

const TINY_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const TINY_PNG = Buffer.from(TINY_PNG_BASE64, 'base64');

const TINY_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>';

// ---------------------------------------------------------------------------
// Package exports
// ---------------------------------------------------------------------------

test('package root exports generated icons', async () => {
    const icons = await import('../dist/index.js');

    assert.equal(typeof icons.Kiwi, 'function');
    assert.equal(typeof icons.Drinkprime, 'function');
    assert.equal(typeof icons.Zepto, 'function');
});

test('package root does not export generateIcons', async () => {
    const icons = await import('../dist/index.js');

    assert.equal('generateIcons' in icons, false);
});

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

test('generator exports generateIcons', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    assert.equal(typeof generateIcons, 'function');
});

test('generateIcons rejects a missing input directory', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    await assert.rejects(
        () =>
            generateIcons({
                inputDir: './does-not-exist',
                outputDir: './out',
            }),
        /Input directory does not exist/,
    );
});

test('generateIcons converts PNG to an SVG React component', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);

        const outputDir = path.join(tmp, 'out');

        const result = await generateIcons({
            inputDir: tmp,
            outputDir,
        });

        assert.equal(result.icons.length, 1);
        assert.equal(result.icons[0]?.name, 'Logo');
        assert.equal(result.icons[0]?.source, 'logo.png');

        const component = await readFile(
            path.join(outputDir, 'Logo.tsx'),
            'utf8',
        );

        // Raster images should now be converted to SVG paths.
        assert.ok(component.includes('<svg'));

        // The old Base64 approach should no longer exist.
        assert.ok(!component.includes('data:image/png;base64,'));

        const index = await readFile(
            path.join(outputDir, 'index.ts'),
            'utf8',
        );

        assert.ok(index.includes('Logo'));
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});

test('generateIcons converts SVG to a React component', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'icon.svg'), TINY_SVG);

        const outputDir = path.join(tmp, 'out');

        const result = await generateIcons({
            inputDir: tmp,
            outputDir,
        });

        assert.equal(result.icons.length, 1);
        assert.equal(result.icons[0]?.name, 'Icon');

        const component = await readFile(
            path.join(outputDir, 'Icon.tsx'),
            'utf8',
        );

        assert.ok(component.includes('<svg'));
        assert.ok(component.includes('<circle'));

        // SVG should be inline JSX, not a data URI.
        assert.ok(!component.includes('data:image/'));
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});

test('generateIcons refuses to overwrite existing files', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'logo.svg'), TINY_SVG);

        const outputDir = path.join(tmp, 'out');

        await generateIcons({
            inputDir: tmp,
            outputDir,
        });

        await assert.rejects(
            () =>
                generateIcons({
                    inputDir: tmp,
                    outputDir,
                }),
            /Refusing to overwrite/,
        );
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});