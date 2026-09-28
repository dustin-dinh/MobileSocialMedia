/**
 * Human-friendly relative time formatter.
 *
 * Converts an ISO-8601 date string (or Date) into a short label such as
 * "just now", "5m", "2h", "3d", "2w", etc.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

type TimeUnit = {
  label: string;
  threshold: number;
  value: number;
};

const UNITS: TimeUnit[] = [
  { label: 'y', threshold: YEAR, value: YEAR },
  { label: 'mo', threshold: MONTH, value: MONTH },
  { label: 'w', threshold: WEEK, value: WEEK },
  { label: 'd', threshold: DAY, value: DAY },
  { label: 'h', threshold: HOUR, value: HOUR },
  { label: 'm', threshold: MINUTE, value: MINUTE },
];

/**
 * Format an ISO date string to a relative "time ago" label.
 *
 * @example
 * formatTimeAgo('2026-09-28T12:00:00Z'); // "2h"
 */
export function formatTimeAgo(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = Date.now();
  const elapsed = now - date.getTime();

  if (elapsed < MINUTE) {
    return 'just now';
  }

  for (const unit of UNITS) {
    if (elapsed >= unit.threshold) {
      const count = Math.floor(elapsed / unit.value);

      return `${count}${unit.label}`;
    }
  }

  return 'just now';
}
