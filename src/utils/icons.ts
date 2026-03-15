import {
  createIcons,
  createElement,
  GitFork,
  Eye,
  AlertCircle,
  Calendar,
  SquarePen,
  CircleHelp,
} from 'lucide';

/**
 * Initialize all Lucide icons on the page
 * Finds all elements with data-lucide attribute and replaces them with SVG icons
 * Only includes the icons we explicitly import (tree-shakeable)
 */
export function initIcons(): void {
  createIcons({
    icons: {
      GitFork,
      Eye,
      AlertCircle,
      Calendar,
      SquarePen,
      CircleHelp,
    },
  });
}

/**
 * Creates an icon element HTML string
 * @param name - The icon name (e.g., 'git-fork', 'eye', 'alert-circle')
 * @param className - Optional CSS class names
 * @returns HTML string for the icon placeholder
 */
export function renderIcon(name: string, className: string = ''): string {
  return `<i data-lucide="${name}" class="${className}"></i>`;
}

/**
 * Renders a Lucide icon component as an SVG HTML string at 16×16px.
 */
export function getIconHTML(
  iconComponent: Parameters<typeof createElement>[0],
): string {
  const icon = createElement(iconComponent);
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('stroke-width', '2');
  return icon.outerHTML;
}
