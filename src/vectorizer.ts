import sharp, { type Metadata } from 'sharp';
import { imageTracer } from 'imagetracer';

export interface VectorizeOptions {
    /**
     * Maximum width/height used during tracing.
     *
     * Large source images are resized before tracing to avoid
     * generating unnecessarily complex SVGs.
     */
    maxDimension?: number;

    /**
     * Maximum number of colors used by the tracer.
     */
    numberOfColors?: number;

    /**
     * Remove paths smaller than this threshold.
     */
    pathOmit?: number;

    /**
     * Error threshold for straight lines.
     */
    lineTolerance?: number;

    /**
     * Error threshold for quadratic curves.
     */
    curveTolerance?: number;

    /**
     * Round SVG coordinates to this many decimal places.
     */
    roundCoordinates?: number;

    /**
     * Automatically detect and remove solid canvas background color.
     * Defaults to true.
     */
    removeBackground?: boolean;
}

export interface VectorizeResult {
    svg: string;
    sourceWidth: number;
    sourceHeight: number;
    tracedWidth: number;
    tracedHeight: number;
}

const DEFAULT_OPTIONS: Required<VectorizeOptions> = {
    maxDimension: 512,
    numberOfColors: 4,
    pathOmit: 8,
    lineTolerance: 0.3,
    curveTolerance: 0.5,
    roundCoordinates: 1,
    removeBackground: true,
};

function validateOptions(options: Required<VectorizeOptions>): void {
    if (!Number.isFinite(options.maxDimension) || options.maxDimension <= 0) {
        throw new Error('maxDimension must be greater than 0.');
    }

    if (!Number.isInteger(options.numberOfColors) || options.numberOfColors < 2) {
        throw new Error('numberOfColors must be an integer greater than or equal to 2.');
    }

    if (!Number.isFinite(options.pathOmit) || options.pathOmit < 0) {
        throw new Error('pathOmit must be greater than or equal to 0.');
    }

    if (!Number.isFinite(options.lineTolerance) || options.lineTolerance <= 0) {
        throw new Error('lineTolerance must be greater than 0.');
    }

    if (!Number.isFinite(options.curveTolerance) || options.curveTolerance <= 0) {
        throw new Error('curveTolerance must be greater than 0.');
    }

    if (
        !Number.isInteger(options.roundCoordinates) ||
        options.roundCoordinates < 0 ||
        options.roundCoordinates > 5
    ) {
        throw new Error('roundCoordinates must be an integer between 0 and 5.');
    }
}

export async function rasterToSvg(
    inputPath: string,
    options: VectorizeOptions = {},
): Promise<VectorizeResult> {
    const config: Required<VectorizeOptions> = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

    validateOptions(config);

    let sourceMetadata: Metadata;

    try {
        sourceMetadata = await sharp(inputPath).metadata();
    } catch (error) {
        throw new Error(
            `Cannot read image "${inputPath}": ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    if (!sourceMetadata.width || !sourceMetadata.height) {
        throw new Error(`Cannot determine image dimensions for "${inputPath}".`);
    }

    const sourceWidth = sourceMetadata.width;
    const sourceHeight = sourceMetadata.height;

    // 1. Resize image to normalized icon dimensions with alpha
    let { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .resize({
            width: config.maxDimension,
            height: config.maxDimension,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

    let width = info.width;
    let height = info.height;
    let pixels = new Uint8ClampedArray(data);

    // 2. Smart background removal: detect uniform border/corner colors
    let bgInfo: { r: number; g: number; b: number } | undefined;
    if (config.removeBackground && width > 4 && height > 4) {
        const cornerIndices = [
            0,
            (width - 1) * 4,
            (height - 1) * width * 4,
            ((height - 1) * width + (width - 1)) * 4,
        ];

        const corners = cornerIndices.map((idx) => ({
            r: pixels[idx] ?? 0,
            g: pixels[idx + 1] ?? 0,
            b: pixels[idx + 2] ?? 0,
            a: pixels[idx + 3] ?? 0,
        }));

        const bg = corners[0]!;
        const isUniformBg = corners.every((c) => {
            const dr = Math.abs(c.r - bg.r);
            const dg = Math.abs(c.g - bg.g);
            const db = Math.abs(c.b - bg.b);
            return (dr + dg + db) < 60 && c.a > 150;
        });

        if (isUniformBg) {
            bgInfo = bg;
            const tolerance = 75;
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i]!;
                const g = pixels[i + 1]!;
                const b = pixels[i + 2]!;
                const dist = Math.hypot(r - bg.r, g - bg.g, b - bg.b);
                if (dist < tolerance) {
                    pixels[i + 3] = 0; // Transparent!
                }
            }

            // Auto-trim transparent borders so the icon is centered and bounds the logo tightly
            try {
                const trimmed = await sharp(Buffer.from(pixels.buffer), {
                    raw: { width, height, channels: 4 },
                })
                    .trim()
                    .extend({
                        top: 4,
                        bottom: 4,
                        left: 4,
                        right: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    })
                    .raw()
                    .toBuffer({ resolveWithObject: true });

                width = trimmed.info.width;
                height = trimmed.info.height;
                pixels = new Uint8ClampedArray(trimmed.data);
            } catch {
                // If trim finds only transparent pixels, retain un-trimmed pixels
            }
        }
    }

    const imageData = {
        width,
        height,
        data: pixels,
    };

    let rawSvg: string;

    try {
        rawSvg = imageTracer.imageDataToSVG(imageData, {
            ltres: config.lineTolerance,
            qtres: config.curveTolerance,
            pathomit: config.pathOmit,

            rightangleenhance: true,

            colorsampling: 2,
            numberofcolors: config.numberOfColors,
            colorquantcycles: 3,

            layering: 0,

            strokewidth: 0,
            linefilter: false,

            scale: 1,
            roundcoords: config.roundCoordinates,

            viewbox: true,
            desc: false,

            blurradius: 0,
            blurdelta: 20,
        });
    } catch (error) {
        throw new Error(
            `Cannot vectorize image "${inputPath}": ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    if (!rawSvg.trim()) {
        throw new Error(`Vectorization produced an empty SVG for "${inputPath}".`);
    }

    // 3. Clean transparent paths, faint background tint artifacts, and full-screen bounding box
    let cleanedSvg = rawSvg
        // Strip any paths with opacity < 0.15 (handles opacity="0", opacity="0.047", etc.)
        .replace(/<path\b[^>]*\bopacity="0(?:\.[0-1]\d*)?"[^>]*\/>\s*/gi, '')
        // Strip any paths with rgba fill where alpha is near 0
        .replace(/<path\b[^>]*\bfill="rgba\([^)]*,\s*0(?:\.[0-1]\d*)?\)"[^>]*\/>\s*/gi, '')
        // Remove redundant full-canvas background boxes
        .replace(new RegExp(`<path\\b[^>]*d="M\\s*0[,\\s]0\\s*[^"]*${width}[^"]*"[^>]*\\/>\\s*`, 'gi'), '')
        // Clean redundant opacity="1" attributes
        .replace(/\s+opacity="1"/g, '');

    // If a uniform background color was detected and removed, strip any paths whose fill is close to that bg color
    if (bgInfo) {
        cleanedSvg = cleanedSvg.replace(/<path\b[^>]*\bfill="rgb\((\d+),\s*(\d+),\s*(\d+)\)"[^>]*\/>\s*/gi, (match, r, g, b) => {
            const dist = Math.hypot(Number(r) - bgInfo!.r, Number(g) - bgInfo!.g, Number(b) - bgInfo!.b);
            if (dist < 60) {
                return '';
            }
            return match;
        });

        // If the detected background was a vibrant brand color (e.g. Snapdeal red or Upstox purple)
        // and the extracted glyphs are white/near-white, map the glyphs to that brand color so the icon
        // is prominently visible and branded instead of an invisible washed-out white shape.
        const bgSaturation = Math.max(bgInfo.r, bgInfo.g, bgInfo.b) - Math.min(bgInfo.r, bgInfo.g, bgInfo.b);
        if (bgSaturation > 40) {
            const brandHex = `#${[bgInfo.r, bgInfo.g, bgInfo.b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
            cleanedSvg = cleanedSvg.replace(/<path\b([^>]*\bfill="rgb\((\d+),\s*(\d+),\s*(\d+)\)"[^>]*)>/gi, (match, before, r, g, b) => {
                const nr = Number(r), ng = Number(g), nb = Number(b);
                const isLightNeutral = Math.min(nr, ng, nb) > 170 && (Math.max(nr, ng, nb) - Math.min(nr, ng, nb)) < 45;
                if (isLightNeutral) {
                    return match
                        .replace(/fill="rgb\([^)]+\)"/, `fill="${brandHex}"`)
                        .replace(/stroke="rgb\([^)]+\)"/, `stroke="${brandHex}"`);
                }
                return match;
            });
        }
    }

    // Safety fallback for test cases or single-pixel solid images
    if (!cleanedSvg.includes('<path') && rawSvg.includes('<path')) {
        cleanedSvg = rawSvg.replace(/\s+opacity="1"/g, '');
    }

    return {
        svg: cleanedSvg,
        sourceWidth,
        sourceHeight,
        tracedWidth: width,
        tracedHeight: height,
    };
}