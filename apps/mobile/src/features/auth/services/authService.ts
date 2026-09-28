import { httpClient } from '../../../services/httpClient';
import type { LoginFormValues, RegisterFormValues } from '../validation';

export type AuthUser = {
  avatarUrl: string | null;
  bio: string | null;
  createdAt?: string;
  displayName: string | null;
  email: string;
  id: string;
  updatedAt?: string;
  username: string;
};

type UserResponse = {
  data: AuthUser;
};

type LoginResponse = {
  data: {
    accessToken?: string;
    token?: string;
    user: AuthUser;
  };
};

type RegisterRequest = Pick<RegisterFormValues, 'email' | 'password' | 'username'>;
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

    const rawToken = response.data.accessToken ?? response.data.token;
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '' || rawToken === 'undefined') {
      throw new Error('Invalid or missing authentication token from server');
    }

    return {
      accessToken: rawToken.trim(),
      user: response.data.user,
    };
  },
  async logout(accessToken: string): Promise<void> {
    await httpClient.requestVoid({
      headers: getAuthorizationHeaders(accessToken),
      method: 'POST',
      path: 'auth/logout',
    });
  },
  async register(values: RegisterFormValues): Promise<AuthUser> {
    const body: RegisterRequest = {
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
