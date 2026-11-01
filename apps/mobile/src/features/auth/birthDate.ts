/**
 * Date-of-birth input shared by registration and the one-time birth date
 * screen. Typed as DD/MM/YYYY (no date-picker dependency, same on Android
 * and iOS) and sent to the API as YYYY-MM-DD. The server applies the same
 * 18+ rule; this check only gives the answer before a round trip.
 */
export const MINIMUM_AGE = 18;

/** Adds the slashes while typing: "01021990" -> "01/02/1990". */
export function formatBirthDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);

  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

/** "DD/MM/YYYY" -> "YYYY-MM-DD", or null when it is not a real calendar date. */
export function parseBirthDateInput(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

/** Full years between an ISO birth date and `today` (both YYYY-MM-DD). */
export function ageOn(birthDate: string, today: string): number {
  const [year, month, day] = today.split('-').map(Number);
  const [bornYear, bornMonth, bornDay] = birthDate.split('-').map(Number);
  const hadBirthday = month > bornMonth || (month === bornMonth && day >= bornDay);

  return year - bornYear - (hadBirthday ? 0 : 1);
}

function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type BirthDateProblem = 'missing' | 'invalid' | 'future' | 'underage';

/** Why a typed date cannot be used, or null when it is a valid 18+ birth date. */
export function birthDateProblem(text: string, today = localToday()): BirthDateProblem | null {
  if (!text.trim()) {
    return 'missing';
  }

  const iso = parseBirthDateInput(text);

  if (!iso || Number(iso.slice(0, 4)) < 1900) {
    return 'invalid';
  }

  if (iso > today) {
    return 'future';
  }

  return ageOn(iso, today) < MINIMUM_AGE ? 'underage' : null;
}
