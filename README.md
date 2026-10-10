# @taterlaxmi/react-icon-library

> Lightweight, typed, and accessible brand icons for React (Kiwi, Drinkprime, Zepto, and more), inspired by [lucide-react](https://github.com/lucide-icons/lucide).

[![npm version](https://img.shields.io/npm/v/@taterlaxmi/react-icon-library.svg)](https://www.npmjs.com/package/@taterlaxmi/react-icon-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- ⚡ **Lightweight & Tree-Shakeable**: Clean vector geometry with 90%+ bundle size reduction compared to autotraced bitmaps.
- 🎨 **Lucide-Style Props**: Full support for `size`, `color`, `className`, `style`, and standard SVG attributes.
- ♿ **Accessible by Default**: Set `title` for screen readers (`role="img"`), or omit for decorative icons (`aria-hidden="true"`).
- 🧩 **Zero Runtime Dependencies**: Consuming apps only need `react` (>=18) as a peer dependency. No heavy C++ binaries or bloat.
- 🛠️ **`createIcon` Primitive**: Easily define custom brand icons with the exact same consistent API.

---

## Installation

```bash
npm install @taterlaxmi/react-icon-library
```

---

## Quick Start

Import icons directly from the package root:

```tsx
import { Kiwi, Drinkprime, Zepto } from '@taterlaxmi/react-icon-library';

export function BrandShowcase() {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Default 24x24 brand icons */}
      <Kiwi />
      <Drinkprime />
      <Zepto />

      {/* Custom size (sets both width and height) */}
      <Kiwi size={36} />

      {/* Custom color override */}
      <Drinkprime size={32} color="#2563eb" />

      {/* Accessible labeled icon */}
      <Zepto size={28} title="Zepto Quick Commerce" />
    </div>
  );
}
```

---

## Component Props

Every icon accepts `IconProps`, extending standard SVG attributes:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number \| string` | `24` | Sets both `width` and `height` in pixels or CSS units (`24`, `'2rem'`). |
| `color` | `string` | Brand default | Overrides the icon's primary fill/stroke color. |
| `title` | `string` | `undefined` | Accessible label. When provided, `aria-hidden` is set to `false` and `role="img"`. |
| `titleId` | `string` | `undefined` | ID assigned to the `<title>` element for `aria-labelledby` linking. |
| `width` | `number \| string` | `size` | Overrides the width individually. |
| `height` | `number \| string` | `size` | Overrides the height individually. |
| `className` | `string` | `undefined` | CSS class name passed to the `<svg>` root element. |
| `style` | `CSSProperties` | `undefined` | Inline styles passed to the `<svg>` root element. |
| `ref` | `Ref<SVGSVGElement>` | `undefined` | React ref attached to the `<svg>` element. |

TypeScript types are exported for each icon:

```tsx
import { Kiwi, type KiwiProps, type IconProps } from '@taterlaxmi/react-icon-library';
```

---

## Creating Custom Icons

Use the exported `createIcon` helper to build new brand icons with the exact same Lucide-style features:

```tsx
import { createIcon } from '@taterlaxmi/react-icon-library';

export const MyBrand = createIcon('MyBrand', '0 0 24 24', (props) => (
  <path
    d="M12 2L2 22h20L12 2z"
    fill={props.color ?? '#e11d48'}
  />
));

// Now use it anywhere:
// <MyBrand size={32} title="My Brand" />
```

---

## Available Icons

| Icon | Component | Default Color | ViewBox |
| --- | --- | --- | --- |
| **DrinkPrime** | `<Drinkprime />` | `#4548B9` | `0 0 48 36` |
| **Kiwi** | `<Kiwi />` | `#81BE56` | `0 0 120 32` |
| **Zepto** | `<Zepto />` | `#950EDB` | `0 0 90 30` |

---

## Architecture & Design Decisions

### Why Clean Vector Paths over Bitmap Autotracing?
Earlier versions used `imagetracer` to autotrace PNG/JPEG files into SVG paths. In practice, autotracing produces:
- 50 KB+ of jagged polygon coordinates for a single icon.
- Opaque, solid background rectangles that break dark mode and colored cards.
- Muddy color quantization that cannot be styled with CSS or `currentColor`.

This library was re-architected to use **pristine vector paths**:
1. Icons have transparent backgrounds and scalable geometry.
2. Bundle size dropped from **67.5 KB** down to **8.6 KB** (~90% smaller).
3. Icons share the Lucide design principles (predictable `size`, `color`, and `title` props).

---

## Adding Assets & Generating Components

To add or regenerate brand icons in this repository:

1. Place clean SVG files in `brand-assets/` (e.g. `brand-assets/mybrand.svg`).
2. Run the generator:

```bash
npm run dev
```

This compiles your SVGs into typed components in `src/icons/`.

### CLI Usage in Another Project

```bash
npx react-icon-library ./brand-assets --output ./src/icons --overwrite
```

| Option | Default | Description |
| --- | --- | --- |
| `[input-dir]` | `icons` | Directory containing SVG/image assets |
| `-o, --output` | `src/icons` | Output directory for `.tsx` components and barrel index |
| `--overwrite` | `false` | Replace existing generated files |
| `--no-recursive` | `false` | Scan only top-level files in the input folder |

---

---

## Testing & Visual Quality Validation

You can validate both the code functionality and visual rendering quality at any time:

### 1. Automated Verification (Build, Typecheck, and Unit Tests)
Run the full pre-publish verification suite with one command:

```bash
npm run prepublishOnly
```

This runs:
- `npm run build`: Compiles tree-shakeable ESM, CJS, and TypeScript declaration (`.d.ts`) bundles via `tsup`.
- `npm run typecheck`: Validates full TypeScript type soundness (`tsc --noEmit`).
- `npm test`: Executes 10 unit tests verifying package exports, `size` scaling, `color` overrides, and accessibility attributes.

### 2. Interactive Visual Gallery (`preview.html`)
To inspect the visual image quality, anti-aliasing, and transparency of the icons in the browser:

```bash
npm run preview
```

Or open [`preview.html`](preview.html) directly in any browser. The preview page includes:
- **Live Size Scaler**: Scale from 16px to 160px to inspect crispness.
- **Color Overrides**: Test monochrome vs. brand colors in real-time.
- **Dark/Light Mode & Checkerboard Toggle**: Verify 100% transparent backgrounds without opaque box artifacts.
- **Copy JSX / Copy SVG**: Quick snippet copying for development.

---

## Continuous Integration (CI)

A GitHub Actions workflow is set up at [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It automatically runs on every push and pull request across **Node 18, 20, and 22**, ensuring:
- Clean dependency installation
- Full TypeScript type checking
- Cross-platform build verification
- Unit test suite execution

---

## License

[MIT](LICENSE) © React Icon Library contributors
