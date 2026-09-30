import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';

/**
 * Flag to control mock vs live API calls.
 * Set to false once backend endpoints are available.
 */
export const USE_MOCK = true;

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
        message: 'Enter a valid email address.',
        status: 400,
      });
    }

    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);
      return {
        message: 'A verification code has been sent to your email.',
        success: true,
      };
    }

    const response = await httpClient.requestJson<PasswordResetResponse, RequestResetCodeRequest>({
      body: { email: normalizedEmail },
      method: 'POST',
      path: 'auth/forgot-password',
    });

    return response;
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
        message: 'Enter a valid email address.',
        status: 400,
      });
    }

    if (!normalizedCode || !/^\d{6}$/.test(normalizedCode)) {
      throw new ApiError({
        kind: 'server',
        message: 'Verification code must be exactly 6 digits.',
        status: 400,
      });
    }

    if (USE_MOCK) {
      await delay(MOCK_DELAY_MS);

      if (normalizedCode !== MOCK_VERIFICATION_CODE) {
        throw new ApiError({
          kind: 'server',
          message: 'Invalid or expired verification code.',
          status: 400,
        });
      }

      return {
        message: 'Verification code confirmed successfully.',
        success: true,
      };
    }

    const response = await httpClient.requestJson<PasswordResetResponse, VerifyResetCodeRequest>({
      body: {
        code: normalizedCode,
        email: normalizedEmail,
      },
      method: 'POST',
      path: 'auth/verify-reset-code',
    });

    return response;
  },
};
