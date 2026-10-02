# React Icon Library

Generate reusable, typed React icon components from SVG and raster image files. The CLI converts SVGs to JSX and wraps raster images in SVG components with the image data embedded.

## Requirements

- Node.js 20 or newer
- npm
- A React application to render the generated components

## Generate icons in this repository

Put source images in `brand-assets/`. For example:

```text
react-icon-library/
├── brand-assets/
│   └── kiwi.png
└── src/
```

Install dependencies, then run the default command:

```bash
npm install
npm run dev
```

The `dev` script uses `brand-assets/` as its input and writes components to `src/icons/`. For the example above it generates `src/icons/Kiwi.tsx` and `src/icons/index.ts`. The component name is based on the filename: `kiwi.png` becomes `Kiwi` and `kiw.png` becomes `Kiw`.

**Rerunning `npm run dev` overwrites generated files** in `src/icons/`. Avoid editing generated components by hand; change the source image and regenerate instead.

## Use the generator in another repository

The generator package runs against image files in the React app where you invoke it. In the other React application's root, place the image in a folder such as `brand-assets/kiwi.png`, then install this GitHub package as a development dependency:

```bash
npm install --save-dev github:taterlaxmi/react-icon-library
npx react-icon-library ./brand-assets --output ./src/icons
```

The CLI does not overwrite existing files by default. To regenerate an existing icon set, add `--overwrite`:

```bash
npx react-icon-library ./brand-assets --output ./src/icons --overwrite
```

Commit the generated `src/icons/` files in the React app. Import its generated icon like this:

```tsx
import { Kiwi } from './icons';

export function Brand() {
	return <Kiwi title="Kiwi" width={32} height={32} />;
}
```

The installed package provides the generator CLI and `generateIcons()` API; it does **not** currently export this repository's sample `Kiwi` component from the package root. To use Kiwi in another app, put `kiwi.png` in that app's `brand-assets/` folder and generate the component there as shown above.

## CLI options

General form:

```bash
npx react-icon-library [input-dir] --output <directory> [options]
```

| Argument or option | Default | Description |
| --- | --- | --- |
| `[input-dir]` | `icons` | Folder containing the images |
| `-o, --output <directory>` | `src/icons` | Folder for generated `.tsx` files and the barrel export |
| `--no-recursive` | Recursive scan enabled | Only read images directly inside the input folder |
| `--overwrite` | Off | Replace existing generated component and index files |

From this repository, `npm run generate -- ./brand-assets --output ./src/icons` runs the CLI with custom paths. Paths are resolved from the current working directory.

## Supported images

- SVG (`.svg`): optimized and converted to inline JSX.
- PNG, JPEG (`.jpg`, `.jpeg`), GIF, WebP, and AVIF: embedded in the generated SVG component as a data URI.

Prefer SVG for logos and icons when possible; raster files remain raster images and the embedded data increases the generated source size. Unsupported extensions are skipped. Symbolic links are ignored. Do not feed untrusted SVG files to the generator.

## Accessibility and component props

Generated icons accept SVG props such as `className`, `style`, `width`, and `height`. Supply `title` to provide an accessible label; omit it for a decorative icon.

## Programmatic API

```ts
import { generateIcons } from 'react-icon-library';

const result = await generateIcons({
	inputDir: './brand-assets',
	outputDir: './src/icons',
	recursive: true,
	overwrite: true,
});

console.log(result.icons);
```

`inputDir` and `outputDir` are required. `recursive` defaults to `true`; `overwrite` defaults to `false`. The function returns generated icon names and file paths, and reports missing directories, invalid assets, name collisions, and existing output with errors.

## License

MIT. See [LICENSE](LICENSE).
