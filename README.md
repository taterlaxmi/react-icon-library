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

## Use icons in another repository

Install the package in a React application:

```bash
npm install @taterlaxmi/react-icon-library
```

Import icons directly from the package root. You do not need to copy an image or run the generator in the consuming app:

```tsx
import { Drinkprime, Kiwi, Zepto } from '@taterlaxmi/react-icon-library';

export function Brand() {
	return (
		<div>
			<Kiwi title="Kiwi" width={32} height={32} />
			<Drinkprime title="Drinkprime" width={32} height={32} />
			<Zepto title="Zepto" width={32} height={32} />
		</div>
	);
}
```

The package declares React as a peer dependency, so the consuming application should already have React installed. If the app uses TypeScript, `KiwiProps` is also exported:

```tsx
import { Kiwi, type KiwiProps } from '@taterlaxmi/react-icon-library';
```

## Generate additional icons

The package also provides a CLI and programmatic generator for your own image assets. In the consuming app, put images in a folder such as `brand-assets/`, then run:

```bash
npx react-icon-library ./brand-assets --output ./src/icons
```

The CLI does not overwrite existing generated files by default. Add `--overwrite` to regenerate them. Generated components are local source files and can be imported from the app's own `./icons` module.

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
