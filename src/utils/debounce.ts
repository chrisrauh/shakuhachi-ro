/**
 * Creates a debounced function that delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * Optionally enforces a maximum wait time via `maxWait`, after which `fn` will be invoked
 * even if the function continues to be called.
 *
 * @param fn - The function to debounce
 * @param delay - The number of milliseconds to delay (inactivity period)
 * @param maxWait - Optional maximum time to wait before forcing execution
 * @returns A debounced version of the function
 *
 * @example
 * const save = debounce(() => saveToDatabase(), 2000, 5000);
 * // Will save after 2s of inactivity, or force save after 5s of continuous changes
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  maxWait?: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let latestArgs: Parameters<T> | null = null;
  let latestThis: unknown = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();

    // Capture latest arguments and this context
    latestArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestThis = this;

    // Clear existing inactivity timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Setup max wait timeout on first call
    if (maxWait !== undefined && lastCallTime === null) {
      lastCallTime = now;
      maxWaitTimeoutId = setTimeout(() => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastCallTime = null;
        maxWaitTimeoutId = null;
        if (latestArgs !== null) {
          fn.apply(latestThis, latestArgs);
        }
      }, maxWait);
    }

    // Setup inactivity timeout
    timeoutId = setTimeout(() => {
      // Clear max wait timeout if it exists
      if (maxWaitTimeoutId !== null) {
        clearTimeout(maxWaitTimeoutId);
        maxWaitTimeoutId = null;
      }
      lastCallTime = null;
      timeoutId = null;
      if (latestArgs !== null) {
        fn.apply(latestThis, latestArgs);
      }
    }, delay);
  };
}
