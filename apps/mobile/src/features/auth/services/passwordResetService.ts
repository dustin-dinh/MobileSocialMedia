import { USE_MOCK_API } from '../../../config/runtime';
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';

/** Mock vs live API calls, following the app-wide switch. */
export const USE_MOCK = USE_MOCK_API;

/** Mock OTP verification code accepted for testing */
export const MOCK_VERIFICATION_CODE = '123456';

/** Simulated network delay for mock responses */
const MOCK_DELAY_MS = 300;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PasswordResetResponse = {
  message: string;
  success: boolean;
};

export type RequestResetCodeRequest = {
  email: string;
};

export type VerifyResetCodeRequest = {
  code: string;
  email: string;
};

export const passwordResetService = {
  /**
   * Request a 6-digit password reset code sent to the specified email.
   */
  async requestResetCode(email: string): Promise<PasswordResetResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      throw new ApiError({
        kind: 'server',
        message: 'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.',
        status: 400,
      });
    }

    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return {
        message: 'Đã gửi mã xác minh tới email của bạn.',
        success: true,
      };
    }

    // The backend answers with the same generic message whether or not the
    // account exists, so the app never reveals which emails are registered.
    const response = await httpClient.requestJson<{ message?: string }, RequestResetCodeRequest>({
      body: { email: normalizedEmail },
      method: 'POST',
      path: 'auth/forgot-password',
    });

    return {
      message: response.message ?? 'Nếu email đã đăng ký, mã đặt lại mật khẩu sẽ được gửi tới email.',
      success: true,
    };
  },

  /**
   * Verify the 6-digit verification code for the specified email.
   */
  async verifyResetCode(email: string, code: string): Promise<PasswordResetResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      throw new ApiError({
        kind: 'server',
        message: 'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.',
        status: 400,
      });
    }

    if (!normalizedCode || !/^\d{6}$/.test(normalizedCode)) {
      throw new ApiError({
        kind: 'server',
        message: 'Mã xác minh gồm đúng 6 chữ số.',
        status: 400,
      });
    }

    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      if (normalizedCode !== MOCK_VERIFICATION_CODE) {
        throw new ApiError({
          kind: 'server',
          message: 'Mã xác minh không đúng hoặc đã hết hạn.',
          status: 400,
        });
      }

      return {
        message: 'Đã xác nhận mã.',
        success: true,
      };
    }

    // The backend has no separate "verify" step: the code is checked together
    // with the new password by `resetPassword`. Here it only has to be well-formed.
    return {
      message: 'Nhập mật khẩu mới để hoàn tất.',
      success: true,
    };
  },

  /**
   * Set a new password using the emailed 6-digit code.
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<PasswordResetResponse> {
    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      if (code.trim() !== MOCK_VERIFICATION_CODE) {
        throw new ApiError({
          kind: 'server',
          message: 'Mã đặt lại mật khẩu không đúng hoặc đã hết hạn.',
          status: 400,
        });
      }

      return { message: 'Đã đặt lại mật khẩu.', success: true };
    }

    await httpClient.requestVoid<{ email: string; newPassword: string; otp: string }>({
      body: {
        email: email.trim().toLowerCase(),
        newPassword,
        otp: code.trim(),
      },
      method: 'POST',
      path: 'auth/reset-password',
    });

    return { message: 'Đã đặt lại mật khẩu.', success: true };
  },
};
