import * as react from 'react';
import { SVGProps } from 'react';

interface DrinkprimeProps extends SVGProps<SVGSVGElement> {
    title?: string;
}
declare function Drinkprime({ title, width, height, ...props }: DrinkprimeProps): react.JSX.Element;

interface KiwiProps extends SVGProps<SVGSVGElement> {
    title?: string;
}
declare function Kiwi({ title, width, height, ...props }: KiwiProps): react.JSX.Element;

interface ZeptoProps extends SVGProps<SVGSVGElement> {
    title?: string;
}
declare function Zepto({ title, width, height, ...props }: ZeptoProps): react.JSX.Element;

export { Drinkprime, type DrinkprimeProps, Kiwi, type KiwiProps, Zepto, type ZeptoProps };
