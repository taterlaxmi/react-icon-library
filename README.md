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
| **Klook** | `<Klook />` | `#EF987A` | `0 0 500 135` |
| **Livpure Smart** | `<LivpureSmart />` | `#4E2C8B` | `0 0 200 143` |
| **PhonePe** | `<Phonepe />` | `#5E249E` | `0 0 264 264` |
| **Slice** | `<Slice />` | `#8E19C0` | `0 0 186 72` |
| **Snapdeal** | `<Snapdeal />` | `#FF003E` | `0 0 216 174` |
| **Upstox** | `<Upstox />` | `#432974` | `0 0 60 23` |
| **Zepto** | `<Zepto />` | `#950EDB` | `0 0 90 30` |
| **Zerodha** | `<Zerodha />` | `#9864F2` | `0 0 184 41` |

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

## Adding New Brand Icons (Automated Workflow)

Adding an icon to the library requires only **two simple steps**:

### Step 1: Drop the Image into `brand-assets/`
Place your image file in `brand-assets/` using lowercase kebab-case (SVG recommended for best quality, or PNG/JPEG):
- `brand-assets/livpure-smart.svg` (or `livpure-smart.png`)

> **Naming Rule**: The filename automatically defines the PascalCase React component:
> `livpure-smart.svg` $\rightarrow$ `<LivpureSmart />` and `type LivpureSmartProps`

### Step 2: Run One Command

```bash
npm run dev
```

**Everything else happens automatically behind the scenes**:
1. 🎨 **Auto-Conversion**: Converts your asset into a Lucide-style React component (`src/icons/LivpureSmart.tsx`).
2. 📦 **Auto-Export**: Re-exports the new component in `src/icons/index.ts` and the package root.
3. 🔨 **Auto-Build**: Compiles ESM, CJS, and TypeScript definitions into `dist/`.
4. ✨ **Auto-Sync Preview**: Regenerates `preview.html` with a new interactive card for your icon.
5. 🌐 **Auto-Launch**: Opens `preview.html` in your browser so you can immediately inspect visual quality.

> 💡 **Silent Build**: If you just want to build without opening the browser, run:
> ```bash
> npm run build
> ```

---

### CLI Usage in External Projects

You can also run the generator as a standalone CLI in any project:

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

A GitHub Actions workflow is set up at [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It automatically runs on every push and pull request on **Node.js 22**, ensuring:
- Clean dependency installation (`npm ci`)
- Full TypeScript type checking (`npm run typecheck`)
- Package build verification (`npm run build`)
- Unit test suite execution (`npm test`)

---

## License

[MIT](LICENSE) © React Icon Library contributors
