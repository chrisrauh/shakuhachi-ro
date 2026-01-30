import { GitFork, Eye, AlertCircle, Calendar } from 'lucide';

/**
 * Renders a Lucide icon as an HTML string
 * @param icon - The Lucide icon function
 * @param size - Icon size in pixels (default: 16)
 * @param className - Optional CSS class names
 * @returns HTML string for the icon
 */
export function renderIcon(
  icon: typeof GitFork,
  size: number = 16,
  className: string = ''
): string {
  const iconElement = icon({
    size,
    strokeWidth: 2,
    class: className
  });

  return iconElement.outerHTML;
}

/**
 * Common icons used throughout the app
 */
export const icons = {
  fork: GitFork,
  eye: Eye,
  alert: AlertCircle,
  calendar: Calendar
};
