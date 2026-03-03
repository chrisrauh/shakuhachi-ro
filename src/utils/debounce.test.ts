import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delays execution until delay passes', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous call on new invocation', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    vi.advanceTimersByTime(500);

    debounced(); // Cancel previous call
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects max wait time and forces execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 2000, 5000);

    // Call repeatedly, preventing normal debounce from firing
    debounced();
    vi.advanceTimersByTime(1000);

    debounced();
    vi.advanceTimersByTime(1000);

    debounced();
    vi.advanceTimersByTime(1000);

    debounced();
    vi.advanceTimersByTime(1000);

    debounced();
    vi.advanceTimersByTime(1000);

    // After 5s total, maxWait should force execution
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced('arg1', 'arg2', 123);
    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('preserves this context', () => {
    const obj = {
      value: 42,
      method: vi.fn(function (this: { value: number }) {
        return this.value;
      }),
    };

    const debounced = debounce(obj.method, 1000);
    debounced.call(obj);
    vi.advanceTimersByTime(1000);

    expect(obj.method).toHaveBeenCalledTimes(1);
  });

  it('works without maxWait parameter', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    // Call repeatedly
    for (let i = 0; i < 10; i++) {
      debounced();
      vi.advanceTimersByTime(500);
    }

    // Should not have been called yet (keeps getting reset)
    expect(fn).not.toHaveBeenCalled();

    // Wait for full delay
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows multiple executions after delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);

    debounced();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses latest arguments when maxWait fires', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 2000, 5000);

    debounced('call1');
    vi.advanceTimersByTime(1000);

    debounced('call2');
    vi.advanceTimersByTime(1000);

    debounced('call3');
    vi.advanceTimersByTime(1000);

    debounced('call4');
    vi.advanceTimersByTime(1000);

    debounced('call5');
    vi.advanceTimersByTime(1000);

    // After maxWait fires, should use latest arguments
    expect(fn).toHaveBeenCalledWith('call5');
  });
});
