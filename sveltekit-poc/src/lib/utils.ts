import { format, parseISO } from 'date-fns';

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}
