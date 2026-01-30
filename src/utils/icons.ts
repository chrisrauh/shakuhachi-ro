import { createIcons, GitFork, Eye, AlertCircle, Calendar } from 'lucide';

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
      Calendar
    }
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
