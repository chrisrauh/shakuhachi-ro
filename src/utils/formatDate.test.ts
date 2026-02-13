import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatHybridDate } from './formatDate';

describe('formatHybridDate', () => {
  beforeEach(() => {
    // Mock current time to ensure consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-13T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows relative time for dates within threshold', () => {
    // 2 days ago
    expect(formatHybridDate('2026-02-11T12:00:00Z')).toBe('2 days ago');

    // 1 week ago
    expect(formatHybridDate('2026-02-06T12:00:00Z')).toBe('7 days ago');

    // 3 weeks ago
    expect(formatHybridDate('2026-01-23T12:00:00Z')).toBe('21 days ago');
  });

  it('shows absolute date for dates beyond threshold', () => {
    // 31 days ago (beyond default 30-day threshold)
    expect(formatHybridDate('2026-01-13T12:00:00Z')).toBe('Jan 13, 2026');

    // 6 months ago
    expect(formatHybridDate('2025-08-13T12:00:00Z')).toBe('Aug 13, 2025');

    // 1 year ago
    expect(formatHybridDate('2025-02-13T12:00:00Z')).toBe('Feb 13, 2025');
  });

  it('respects custom threshold parameter', () => {
    // 10 days ago with 7-day threshold (should use absolute)
    expect(formatHybridDate('2026-02-03T12:00:00Z', 7)).toBe('Feb 3, 2026');

    // 5 days ago with 7-day threshold (should use relative)
    expect(formatHybridDate('2026-02-08T12:00:00Z', 7)).toBe('5 days ago');
  });

  it('handles Date objects', () => {
    const date = new Date('2026-02-11T12:00:00Z');
    expect(formatHybridDate(date)).toBe('2 days ago');
  });

  it('handles very recent dates', () => {
    // 2 hours ago
    expect(formatHybridDate('2026-02-13T10:00:00Z')).toBe('2 hours ago');

    // 5 minutes ago
    expect(formatHybridDate('2026-02-13T11:55:00Z')).toBe('5 minutes ago');
  });
});
