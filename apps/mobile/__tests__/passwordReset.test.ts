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
      expect(errorsEmpty.email).toBe('Nhập địa chỉ email.');

      const errorsWhitespace = validateForgotPassword({ email: '   ' });
      expect(errorsWhitespace.email).toBe('Nhập địa chỉ email.');
    });

    it('validateForgotPassword fails with invalid email formats', () => {
      expect(validateForgotPassword({ email: 'invalid-email' }).email).toBe(
        'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.',
      );
      expect(validateForgotPassword({ email: 'user@domain' }).email).toBe(
        'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.',
      );
      expect(validateForgotPassword({ email: '@domain.com' }).email).toBe(
        'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.',
      );
    });

    it('validateVerificationCode passes with exactly 6 digits', () => {
      expect(validateVerificationCode('123456')).toBeUndefined();
      expect(validateVerificationCode('000000')).toBeUndefined();
      expect(validateVerificationCode('999999')).toBeUndefined();
    });

    it('validateVerificationCode fails when empty, non-digit, or not 6 digits', () => {
      expect(validateVerificationCode('')).toBe('Nhập mã xác minh gồm 6 chữ số.');
      expect(validateVerificationCode('12345')).toBe(
        'Mã xác minh gồm đúng 6 chữ số.',
      );
      expect(validateVerificationCode('1234567')).toBe(
        'Mã xác minh gồm đúng 6 chữ số.',
      );
      expect(validateVerificationCode('12a456')).toBe(
        'Mã xác minh gồm đúng 6 chữ số.',
      );
      expect(validateVerificationCode('abcdef')).toBe(
        'Mã xác minh gồm đúng 6 chữ số.',
      );
    });
  });

  describe('passwordResetService.requestResetCode', () => {
    it('succeeds with a valid email in mock mode', async () => {
      const result = await passwordResetService.requestResetCode('test@example.com');
      expect(result.success).toBe(true);
      expect(result.message).toContain('mã xác minh');
    });

    it('fails when email is empty or invalid format', async () => {
      await expect(passwordResetService.requestResetCode('')).rejects.toThrow(ApiError);
      await expect(
        passwordResetService.requestResetCode('not-an-email'),
      ).rejects.toThrow('Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.');
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

  describe('passwordResetService.resetPassword', () => {
    it('accepts the mock code and rejects any other', async () => {
      await expect(
        passwordResetService.resetPassword('user@example.com', MOCK_VERIFICATION_CODE, 'new-password-1'),
      ).resolves.toEqual({ message: 'Đã đặt lại mật khẩu.', success: true });

      await expect(
        passwordResetService.resetPassword('user@example.com', '000000', 'new-password-1'),
      ).rejects.toThrow('Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.');
    });
  });

  describe('passwordResetService.verifyResetCode', () => {
    it('succeeds when code matches MOCK_VERIFICATION_CODE (123456)', async () => {
      const result = await passwordResetService.verifyResetCode(
        'user@example.com',
        MOCK_VERIFICATION_CODE,
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Đã xác nhận');
    });

    it('fails when verification code is incorrect', async () => {
      await expect(
        passwordResetService.verifyResetCode('user@example.com', '999999'),
      ).rejects.toThrow('Mã xác minh không đúng hoặc đã hết hạn.');
    });

    it('fails when code is not 6 digits or contains letters', async () => {
      await expect(
        passwordResetService.verifyResetCode('user@example.com', '123'),
      ).rejects.toThrow('Mã xác minh gồm đúng 6 chữ số.');

      await expect(
        passwordResetService.verifyResetCode('user@example.com', '12a456'),
      ).rejects.toThrow('Mã xác minh gồm đúng 6 chữ số.');
    });

    it('fails when email is invalid format even if code is correct', async () => {
      await expect(
        passwordResetService.verifyResetCode('bad-email', MOCK_VERIFICATION_CODE),
      ).rejects.toThrow('Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.');
    });
  });
});
