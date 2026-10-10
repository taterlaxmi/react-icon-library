import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

export interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  /**
   * Icon size in pixels or CSS units (e.g. 24, '1.5rem').
   * Sets both width and height unless explicitly overridden.
   * @default 24
   */
  size?: number | string;

  /**
   * Color applied to the icon paths or strokes.
   * Defaults to 'currentColor' for monochrome icons or the brand's primary color.
   */
  color?: string;

  /**
   * Accessible title for screen readers. When provided, aria-hidden is set to false.
   */
  title?: string;

  /**
   * Optional id for the <title> element for aria-labelledby pairing.
   */
  titleId?: string;

  /**
   * Ref passed to the SVG root element.
   */
  ref?: Ref<SVGSVGElement>;
}

export type IconComponent = React.FC<IconProps>;

/**
 * Creates a Lucide-compatible, fully typed, accessible React icon component.
 *
 * @param displayName The name of the icon component (e.g. 'Kiwi', 'Drinkprime')
 * @param viewBox The SVG viewBox string (e.g. '0 0 24 24')
 * @param renderContent Render function returning the SVG path/shape elements
 */
export function createIcon(
  displayName: string,
  viewBox: string,
  renderContent: (props: IconProps) => ReactNode,
): IconComponent {
  const Component: IconComponent = (props: IconProps) => {
    const {
      size = 24,
      width,
      height,
      color,
      title,
      titleId,
      className,
      style,
      children,
      ref,
      ...restProps
    } = props;

    const resolvedWidth = width ?? size;
    const resolvedHeight = height ?? size;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={resolvedWidth}
        height={resolvedHeight}
        className={className}
        style={style}
        role={title ? 'img' : undefined}
        aria-hidden={!title}
        aria-labelledby={titleId}
        {...restProps}
      >
        {title ? <title id={titleId}>{title}</title> : null}
        {renderContent(props)}
        {children}
      </svg>
    );
  };

  Component.displayName = displayName;
  return Component;
}
