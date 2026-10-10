import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Test Assets
// ---------------------------------------------------------------------------

const TINY_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>';

const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
);

// ---------------------------------------------------------------------------
// Package Root Exports & Component API
// ---------------------------------------------------------------------------

test('package root exports all brand icons and createIcon helper', async () => {
    const icons = await import('../dist/index.js');

    assert.equal(typeof icons.Kiwi, 'function');
    assert.equal(typeof icons.Drinkprime, 'function');
    assert.equal(typeof icons.Zepto, 'function');
    assert.equal(typeof icons.createIcon, 'function');
    assert.equal('generateIcons' in icons, false, 'Generator should not be leaked in client bundle');
});

test('icons default to 24x24 and aria-hidden when no title is provided', async () => {
    const { Kiwi, Drinkprime, Zepto } = await import('../dist/index.js');

    for (const Component of [Kiwi, Drinkprime, Zepto]) {
        const element = Component({});
        assert.equal(element.props.width, 24);
        assert.equal(element.props.height, 24);
        assert.equal(element.props['aria-hidden'], true);
        assert.equal(element.props.role, undefined);
    }
});

test('icons support custom size, width, height, and color overrides', async () => {
    const { Kiwi } = await import('../dist/index.js');

    // Uniform size
    const sized = Kiwi({ size: 40 });
    assert.equal(sized.props.width, 40);
    assert.equal(sized.props.height, 40);

    // Explicit dimensions override size
    const rect = Kiwi({ size: 40, width: 80, height: 20 });
    assert.equal(rect.props.width, 80);
    assert.equal(rect.props.height, 20);

    // Color override
    const colored = Kiwi({ color: '#ff0055' });
    assert.equal(colored.props.children[1].props.fill, '#ff0055');
});

test('icons are accessible with title and titleId', async () => {
    const { Zepto } = await import('../dist/index.js');

    const accessible = Zepto({ title: 'Zepto Delivery', titleId: 'zepto-label' });
    assert.equal(accessible.props['aria-hidden'], false);
    assert.equal(accessible.props.role, 'img');
    assert.equal(accessible.props['aria-labelledby'], 'zepto-label');

    // Title element rendered as first child
    const titleChild = accessible.props.children[0];
    assert.equal(titleChild.type, 'title');
    assert.equal(titleChild.props.id, 'zepto-label');
    assert.equal(titleChild.props.children, 'Zepto Delivery');
});

test('createIcon helper generates custom icons with consistent API', async () => {
    const { createIcon } = await import('../dist/index.js');

    const CustomIcon = createIcon('CustomBrand', '0 0 32 32', (props) => ({
        type: 'circle',
        props: { cx: 16, cy: 16, r: 16, fill: props.color ?? '#10b981' },
    }));

    assert.equal(CustomIcon.displayName, 'CustomBrand');

    const instance = CustomIcon({ size: 32, title: 'My Brand' });
    assert.equal(instance.props.width, 32);
    assert.equal(instance.props.height, 32);
    assert.equal(instance.props.viewBox, '0 0 32 32');
    assert.equal(instance.props.role, 'img');
});

// ---------------------------------------------------------------------------
// Generator API
// ---------------------------------------------------------------------------

test('generator module exports generateIcons', async () => {
    const { generateIcons } = await import('../dist/generator.js');
    assert.equal(typeof generateIcons, 'function');
});

test('generateIcons rejects a missing input directory', async () => {
    const { generateIcons } = await import('../dist/generator.js');

    await assert.rejects(
        () =>
            generateIcons({
                inputDir: './non-existent-directory',
                outputDir: './out',
            }),
        /Input directory does not exist/,
    );
});

test('generateIcons converts SVG to React component', async () => {
    const { generateIcons } = await import('../dist/generator.js');
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'star.svg'), TINY_SVG);
        const outputDir = path.join(tmp, 'out');

        const result = await generateIcons({ inputDir: tmp, outputDir });
        assert.equal(result.icons.length, 1);
        assert.equal(result.icons[0]?.name, 'Star');

        const component = await readFile(path.join(outputDir, 'Star.tsx'), 'utf8');
        assert.ok(component.includes('<svg'));
        assert.ok(component.includes('<path'));

        const index = await readFile(path.join(outputDir, 'index.ts'), 'utf8');
        assert.ok(index.includes('Star'));
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});

test('generateIcons refuses to overwrite existing files without overwrite flag', async () => {
    const { generateIcons } = await import('../dist/generator.js');
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'brand.svg'), TINY_SVG);
        const outputDir = path.join(tmp, 'out');

        await generateIcons({ inputDir: tmp, outputDir });

        await assert.rejects(
            () => generateIcons({ inputDir: tmp, outputDir }),
            /Refusing to overwrite/,
        );
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});

test('generateIcons converts raster image to vector SVG component', async () => {
    const { generateIcons } = await import('../dist/generator.js');
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'ril-test-'));

    try {
        await writeFile(path.join(tmp, 'logo.png'), TINY_PNG);
        const outputDir = path.join(tmp, 'out');

        const result = await generateIcons({ inputDir: tmp, outputDir });
        assert.equal(result.icons.length, 1);
        assert.equal(result.icons[0]?.name, 'Logo');

        const component = await readFile(path.join(outputDir, 'Logo.tsx'), 'utf8');
        assert.ok(component.includes('<svg'));
    } finally {
        await rm(tmp, { recursive: true, force: true });
    }
});