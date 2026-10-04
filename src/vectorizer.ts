import sharp from 'sharp';
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

const DEFAULT_OPTIONS: Required<VectorizeOptions> = {
    maxDimension: 512,
    numberOfColors: 16,
    pathOmit: 8,
    lineTolerance: 1,
    curveTolerance: 1,
    roundCoordinates: 1,
};

export async function rasterToSvg(
    inputPath: string,
    options: VectorizeOptions = {},
): Promise<string> {
    const config = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

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

    const svg = imageTracer.imageDataToSVG(imageData, {
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

    return svg;
}