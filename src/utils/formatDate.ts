import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Format date as relative time for recent dates, absolute for older dates
 * @param date - Date string or Date object
 * @param thresholdDays - Number of days before switching to absolute format (default: 30)
 * @returns Formatted date string
 */
export function formatHybridDate(
  date: string | Date,
  thresholdDays: number = 30,
): string {
  const dateObj = dayjs(date);
  const now = dayjs();
  const daysDiff = now.diff(dateObj, 'day');

  // Use absolute date for older dates (beyond threshold)
  if (daysDiff >= thresholdDays) {
    return dateObj.format('MMM D, YYYY'); // "Jan 30, 2026"
  }

  // Use weeks for dates between 7 and 30 days
  if (daysDiff >= 7) {
    const weeks = Math.floor(daysDiff / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // Use relative time for very recent dates (< 7 days)
  return dateObj.fromNow(); // "2 days ago", "5 hours ago"
}
