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
    numberOfColors: 8,
    pathOmit: 12,
    lineTolerance: 1,
    curveTolerance: 1,
    roundCoordinates: 1,
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
            `Cannot read image "${inputPath}": ${error instanceof Error ? error.message : String(error)
            }`,
        );
    }

    if (!sourceMetadata.width || !sourceMetadata.height) {
        throw new Error(
            `Cannot determine image dimensions for "${inputPath}".`,
        );
    }

    const sourceWidth = sourceMetadata.width;
    const sourceHeight = sourceMetadata.height;

    const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .resize({
            width: config.maxDimension,
            height: config.maxDimension,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

    const imageData = {
        width: info.width,
        height: info.height,
        data: new Uint8ClampedArray(data),
    };

    let svg: string;

    try {
        svg = imageTracer.imageDataToSVG(imageData, {
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
            `Cannot vectorize image "${inputPath}": ${error instanceof Error ? error.message : String(error)
            }`,
        );
    }

    if (!svg.trim()) {
        throw new Error(`Vectorization produced an empty SVG for "${inputPath}".`);
    }

    return {
        svg,
        sourceWidth,
        sourceHeight,
        tracedWidth: info.width,
        tracedHeight: info.height,
    };
}