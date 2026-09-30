import { ApiError } from '../src/services/apiError';
import {
  MOCK_VERIFICATION_CODE,
  passwordResetService,
} from '../src/features/auth/services/passwordResetService';
import {
  validateForgotPassword,
  validateVerificationCode,
} from '../src/features/auth/validation';

describe('Password Reset Service & Validation (Phase 1)', () => {
  describe('validation helpers', () => {
    it('validateForgotPassword passes with a valid email', () => {
      const errors = validateForgotPassword({ email: 'user@example.com' });
      expect(errors.email).toBeUndefined();
    });

    it('validateForgotPassword fails with an empty or whitespace email', () => {
      const errorsEmpty = validateForgotPassword({ email: '' });
      expect(errorsEmpty.email).toBe('Enter your email address.');

      const errorsWhitespace = validateForgotPassword({ email: '   ' });
      expect(errorsWhitespace.email).toBe('Enter your email address.');
    });

    it('validateForgotPassword fails with invalid email formats', () => {
      expect(validateForgotPassword({ email: 'invalid-email' }).email).toBe(
        'Enter a valid email address.',
      );
      expect(validateForgotPassword({ email: 'user@domain' }).email).toBe(
        'Enter a valid email address.',
      );
      expect(validateForgotPassword({ email: '@domain.com' }).email).toBe(
        'Enter a valid email address.',
      );
    });

    it('validateVerificationCode passes with exactly 6 digits', () => {
      expect(validateVerificationCode('123456')).toBeUndefined();
      expect(validateVerificationCode('000000')).toBeUndefined();
      expect(validateVerificationCode('999999')).toBeUndefined();
    });

    it('validateVerificationCode fails when empty, non-digit, or not 6 digits', () => {
      expect(validateVerificationCode('')).toBe('Enter the 6-digit verification code.');
      expect(validateVerificationCode('12345')).toBe(
        'Verification code must be exactly 6 digits.',
      );
      expect(validateVerificationCode('1234567')).toBe(
        'Verification code must be exactly 6 digits.',
      );
      expect(validateVerificationCode('12a456')).toBe(
        'Verification code must be exactly 6 digits.',
      );
      expect(validateVerificationCode('abcdef')).toBe(
        'Verification code must be exactly 6 digits.',
      );
    });
  });

  describe('passwordResetService.requestResetCode', () => {
    it('succeeds with a valid email in mock mode', async () => {
      const result = await passwordResetService.requestResetCode('test@example.com');
      expect(result.success).toBe(true);
      expect(result.message).toContain('verification code');
    });

    it('fails when email is empty or invalid format', async () => {
      await expect(passwordResetService.requestResetCode('')).rejects.toThrow(ApiError);
      await expect(
        passwordResetService.requestResetCode('not-an-email'),
      ).rejects.toThrow('Enter a valid email address.');
    });

    it('simulates delay using fake timers', async () => {
      jest.useFakeTimers();
      const promise = passwordResetService.requestResetCode('delayed@example.com');
      jest.advanceTimersByTime(350);
      const result = await promise;
      expect(result.success).toBe(true);
      jest.useRealTimers();
    });
  });

  describe('passwordResetService.verifyResetCode', () => {
    it('succeeds when code matches MOCK_VERIFICATION_CODE (123456)', async () => {
      const result = await passwordResetService.verifyResetCode(
        'user@example.com',
        MOCK_VERIFICATION_CODE,
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('confirmed');
    });

    it('fails when verification code is incorrect', async () => {
      await expect(
        passwordResetService.verifyResetCode('user@example.com', '999999'),
      ).rejects.toThrow('Invalid or expired verification code.');
    });

    it('fails when code is not 6 digits or contains letters', async () => {
      await expect(
        passwordResetService.verifyResetCode('user@example.com', '123'),
      ).rejects.toThrow('Verification code must be exactly 6 digits.');

      await expect(
        passwordResetService.verifyResetCode('user@example.com', '12a456'),
      ).rejects.toThrow('Verification code must be exactly 6 digits.');
    });

    it('fails when email is invalid format even if code is correct', async () => {
      await expect(
        passwordResetService.verifyResetCode('bad-email', MOCK_VERIFICATION_CODE),
      ).rejects.toThrow('Enter a valid email address.');
    });
  });
});
