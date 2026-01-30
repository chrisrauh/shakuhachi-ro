import { GitFork, Eye, AlertCircle, Calendar } from 'lucide';

type IconNode = [string, Record<string, string | number>];

/**
 * Converts a Lucide icon data structure to an SVG string
 * @param iconData - The Lucide icon data (array of SVG elements)
 * @param size - Icon size in pixels (default: 16)
 * @returns HTML string for the icon
 */
function iconToSvg(iconData: IconNode[], size: number = 16): string {
  const elements = iconData
    .map(([tag, attrs]) => {
      const attrString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${tag} ${attrString}/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
}

/**
 * Renders a Lucide icon as an HTML string
 * @param iconData - The Lucide icon data
 * @param size - Icon size in pixels (default: 16)
 * @returns HTML string for the icon
 */
export function renderIcon(iconData: IconNode[], size: number = 16): string {
  return iconToSvg(iconData, size);
}

/**
 * Common icons used throughout the app
 */
export const icons = {
  fork: GitFork as unknown as IconNode[],
  eye: Eye as unknown as IconNode[],
  alert: AlertCircle as unknown as IconNode[],
  calendar: Calendar as unknown as IconNode[]
};
