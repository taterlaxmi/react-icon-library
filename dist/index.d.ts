import * as react from 'react';
import { SVGProps } from 'react';

interface KiwiProps extends SVGProps<SVGSVGElement> {
    title?: string;
}
declare function Kiwi({ title, width, height, ...props }: KiwiProps): react.JSX.Element;

interface GenerateIconsOptions {
    inputDir: string;
    outputDir: string;
    recursive?: boolean;
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
declare function generateIcons(options: GenerateIconsOptions): Promise<GenerateIconsResult>;

export { type GenerateIconsOptions, type GenerateIconsResult, type GeneratedIcon, Kiwi, type KiwiProps, generateIcons };
