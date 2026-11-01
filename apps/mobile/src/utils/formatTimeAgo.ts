/**
 * Human-friendly relative time formatter.
 *
 * Converts an ISO-8601 date string (or Date) into a short Vietnamese label:
 * "vừa xong", "5 phút", "2 giờ", "3 ngày", "2 tuần", "4 tháng", "1 năm".
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
  { label: ' năm', threshold: YEAR, value: YEAR },
  { label: ' tháng', threshold: MONTH, value: MONTH },
  { label: ' tuần', threshold: WEEK, value: WEEK },
  { label: ' ngày', threshold: DAY, value: DAY },
  { label: ' giờ', threshold: HOUR, value: HOUR },
  { label: ' phút', threshold: MINUTE, value: MINUTE },
];

/**
 * Format an ISO date string to a relative "time ago" label.
 *
 * @example
 * formatTimeAgo('2026-09-28T12:00:00Z'); // "2 giờ"
 */
export function formatTimeAgo(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = Date.now();
  const elapsed = now - date.getTime();

  if (elapsed < MINUTE) {
    return 'vừa xong';
  }

  for (const unit of UNITS) {
    if (elapsed >= unit.threshold) {
      const count = Math.floor(elapsed / unit.value);

      return `${count}${unit.label}`;
    }
  }

  return 'just now';
}
