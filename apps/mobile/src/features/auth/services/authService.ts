import { USE_MOCK_API } from '../../../config/runtime';
import { ApiError } from '../../../services/apiError';
import { httpClient } from '../../../services/httpClient';
import { parseBirthDateInput } from '../birthDate';
import type { LoginFormValues, RegisterFormValues } from '../validation';

export type AuthUser = {
  avatarUrl: string | null;
  bio: string | null;
  coverUrl?: string | null;
  createdAt?: string;
  displayName: string | null;
  /** False for Google-only accounts, which have no password to confirm with. */
  hasPassword?: boolean;
  /** Null until the first-run setup has been completed or skipped. */
  onboardedAt?: string | null;
  /** YYYY-MM-DD. Null on accounts that have not declared it yet: the app asks before anything else. */
  birthDate?: string | null;
  /** The user lets anonymous senders message them (Settings). */
  allowAnonymousMessages?: boolean;
  /** Who may start a new conversation: everyone (strangers land in requests) or only people I follow. */
  messagePermission?: 'EVERYONE' | 'FOLLOWING';
  /** Sign-in asks for a code emailed to the user (Settings > Bảo mật). */
  twoFactorEnabled?: boolean;
  email: string;
  id: string;
  isPrivate?: boolean;
  updatedAt?: string;
  username: string;
};

type UserResponse = {
  data: AuthUser;
};

type LoginResponse = {
  data: {
    accessToken?: string;
    /** Two-factor accounts: no token yet, a code was emailed. */
    challengeToken?: string;
    email?: string;
    token?: string;
    twoFactorRequired?: boolean;
    user: AuthUser;
  };
};

/**
 * Password (or Google) was right but the account has two-factor sign-in on:
 * a code was emailed. The screen asks for it with `challengeToken`.
 */
export class TwoFactorRequiredError extends Error {
  constructor(
    readonly challengeToken: string,
    readonly email: string,
  ) {
    super('Nhập mã xác minh vừa gửi tới email để hoàn tất đăng nhập.');
    this.name = 'TwoFactorRequiredError';
  }
}

/** Code accepted by the two-factor step in mock mode. */
export const MOCK_TWO_FACTOR_CODE = '123456';

const MOCK_TWO_FACTOR_USER: AuthUser = {
  avatarUrl: null,
  bio: null,
  displayName: 'Nguyễn Nhật Luân',
  email: 'luan@mobilesocial.vn',
  id: 'user-001',
  twoFactorEnabled: true,
  username: 'nhatluan',
};

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

type RegisterRequest = Pick<RegisterFormValues, 'email' | 'password' | 'username'> & {
  /** YYYY-MM-DD */
  birthDate: string;
};
type LoginRequest = LoginFormValues;

type GetCurrentUserOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

function getAuthorizationHeaders(accessToken: string): Record<string, string> {
  const token = typeof accessToken === 'string' ? accessToken.trim() : '';

  if (!token || token === 'undefined' || token === 'null') {
    throw new Error('Cannot construct authorization header: accessToken is missing or invalid');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function extractValidAccessToken(response: LoginResponse): string {
  if (response.data.twoFactorRequired && response.data.challengeToken) {
    throw new TwoFactorRequiredError(response.data.challengeToken, response.data.email ?? '');
  }

  const rawToken = response.data.accessToken ?? response.data.token;
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '' || rawToken === 'undefined') {
    throw new Error('Invalid or missing authentication token from server');
  }

  return rawToken.trim();
}

export const authService = {
  async getCurrentUser(
    accessToken: string,
    options: GetCurrentUserOptions = {},
  ): Promise<AuthUser> {
    const response = await httpClient.requestJson<UserResponse>({
      headers: getAuthorizationHeaders(accessToken),
      method: 'GET',
      path: 'users/me',
      signal: options.signal,
      timeoutMs: options.timeoutMs,
    });

    return response.data;
  },
  async login(values: LoginFormValues): Promise<{ accessToken: string; user: AuthUser }> {
    const body: LoginRequest = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
    const response = await httpClient.requestJson<LoginResponse, LoginRequest>({
      body,
      method: 'POST',
      path: 'auth/login',
    });

    const accessToken = extractValidAccessToken(response);

    return {
      accessToken,
      user: response.data.user,
    };
  },
  async loginWithGoogle(idToken: string): Promise<{ accessToken: string; user: AuthUser }> {
    const response = await httpClient.requestJson<LoginResponse, { idToken: string }>({
      body: { idToken },
      method: 'POST',
      path: 'auth/google',
    });

    const accessToken = extractValidAccessToken(response);

    return {
      accessToken,
      user: response.data.user,
    };
  },
  /** Second step of a two-factor sign-in: the emailed code for `challengeToken`. */
  async verifyTwoFactor(
    challengeToken: string,
    code: string,
  ): Promise<{ accessToken: string; user: AuthUser }> {
    if (USE_MOCK_API) {
      await mockDelay();

      if (code.trim() !== MOCK_TWO_FACTOR_CODE) {
        throw new ApiError({
          kind: 'server',
          message: 'Mã xác minh không đúng hoặc đã hết hạn.',
          status: 401,
        });
      }

      return { accessToken: 'mock-test-access-token', user: MOCK_TWO_FACTOR_USER };
    }

    const response = await httpClient.requestJson<LoginResponse, { challengeToken: string; code: string }>({
      body: { challengeToken, code: code.trim() },
      method: 'POST',
      path: 'auth/2fa/verify',
    });

    return { accessToken: extractValidAccessToken(response), user: response.data.user };
  },
  /** Email a fresh two-factor code (max 5 per hour). */
  async resendTwoFactor(challengeToken: string): Promise<void> {
    if (USE_MOCK_API) {
      await mockDelay();

      return;
    }

    await httpClient.requestVoid<{ challengeToken: string }>({
      body: { challengeToken },
      method: 'POST',
      path: 'auth/2fa/resend',
    });
  },
  /** Signs out every device: the server revokes all tokens of the account. */
  async logout(accessToken: string): Promise<void> {
    await httpClient.requestVoid({
      headers: getAuthorizationHeaders(accessToken),
      method: 'POST',
      path: 'auth/logout',
    });
  },
  /** Confirm the 6-digit code emailed after registration. */
  async verifyEmail(email: string, otp: string): Promise<void> {
    await httpClient.requestVoid<{ email: string; otp: string }>({
      body: { email: email.trim().toLowerCase(), otp: otp.trim() },
      method: 'POST',
      path: 'auth/verify-email',
    });
  },
  /** Ask the backend to email a fresh verification code (max 3 per hour). */
  async resendVerification(email: string): Promise<void> {
    await httpClient.requestVoid<{ email: string }>({
      body: { email: email.trim().toLowerCase() },
      method: 'POST',
      path: 'auth/resend-verification',
    });
  },
  async register(values: RegisterFormValues): Promise<AuthUser> {
    const body: RegisterRequest = {
      // validateRegister already rejected an unparsable date.
      birthDate: parseBirthDateInput(values.birthDate) ?? '',
      email: values.email.trim().toLowerCase(),
      password: values.password,
      username: values.username.trim(),
    };
    const response = await httpClient.requestJson<UserResponse, RegisterRequest>({
      body,
      method: 'POST',
      path: 'auth/register',
    });

    return response.data;
  },
} as const;
