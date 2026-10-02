interface GenerateIconsOptions {
    /** Directory containing source image assets. */
    inputDir: string;
    /** Directory where generated React components and their barrel are written. */
    outputDir: string;
    /** Include nested folders. Enabled by default. */
    recursive?: boolean;
    /** Replace generated files that already exist. Disabled by default. */
    overwrite?: boolean;
}
interface GeneratedIcon {
    name: string;
    source: string;
    componentFile: string;
}
interface GenerateIconsResult {
    icons: GeneratedIcon[];
    outputDir: string;
}
/** Generate typed React components and a named-export barrel from image files. */
declare function generateIcons(options: GenerateIconsOptions): Promise<GenerateIconsResult>;

export { type GenerateIconsOptions, type GenerateIconsResult, type GeneratedIcon, generateIcons };
