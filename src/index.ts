/**
 * Browser-safe entry point — re-exports all pre-built icon components and the createIcon helper.
 * Zero Node.js or native C++ dependencies required at runtime.
 *
 * For the programmatic generator API, import from the sub-path:
 *   import { generateIcons } from '@taterlaxmi/react-icon-library/generator';
 */
export * from './icons/index.js';
export { createIcon, type IconProps, type IconComponent } from './createIcon.js';