import {
  ageOn,
  birthDateProblem,
  formatBirthDateInput,
  parseBirthDateInput,
} from '../src/features/auth/birthDate';
import { validateRegister } from '../src/features/auth/validation';

describe('birth date input (18+ rule)', () => {
  it('adds slashes while typing and ignores other characters', () => {
    expect(formatBirthDateInput('0')).toBe('0');
    expect(formatBirthDateInput('0102')).toBe('01/02');
    expect(formatBirthDateInput('01021990')).toBe('01/02/1990');
    expect(formatBirthDateInput('01/02/1990999')).toBe('01/02/1990');
    expect(formatBirthDateInput('ab01-02.1990')).toBe('01/02/1990');
  });

  it('parses only real calendar dates', () => {
    expect(parseBirthDateInput('29/02/2000')).toBe('2000-02-29');
    expect(parseBirthDateInput('29/02/2001')).toBeNull();
    expect(parseBirthDateInput('31/04/1999')).toBeNull();
    expect(parseBirthDateInput('1/2/1999')).toBeNull();
  });

  it('counts the birthday itself as a full year', () => {
    expect(ageOn('2008-10-17', '2026-10-17')).toBe(18);
    expect(ageOn('2008-10-18', '2026-10-17')).toBe(17);
    expect(ageOn('2008-11-01', '2026-10-17')).toBe(17);
  });

  it('names the problem with a typed date', () => {
    const today = '2026-10-17';

    expect(birthDateProblem('', today)).toBe('missing');
    expect(birthDateProblem('31/02/2000', today)).toBe('invalid');
    expect(birthDateProblem('01/01/1850', today)).toBe('invalid');
    expect(birthDateProblem('01/01/2030', today)).toBe('future');
    expect(birthDateProblem('18/10/2008', today)).toBe('underage');
    expect(birthDateProblem('17/10/2008', today)).toBeNull();
  });

  it('registration refuses people under 18', () => {
    const errors = validateRegister({
      birthDate: formatBirthDateInput(`0101${new Date().getFullYear() - 10}`),
      confirmPassword: 'StrongPassword123!',
      email: 'kid@example.com',
      password: 'StrongPassword123!',
      username: 'kid_01',
    });

    expect(errors.birthDate).toBe('You must be at least 18 years old to use this app.');
  });
});
