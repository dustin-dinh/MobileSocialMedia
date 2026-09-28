import { useEffect, useState } from 'react';

/**
 * A custom hook that delays updating the debounced value until after
 * the specified delay has elapsed since the last time the value changed.
 *
 * @param value The value to debounce.
 * @param delayMs Delay in milliseconds (default: 350ms).
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
