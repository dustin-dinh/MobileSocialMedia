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
    accessToken: string;
    user: AuthUser;
  };
};

type RegisterRequest = Pick<RegisterFormValues, 'email' | 'password' | 'username'>;
type LoginRequest = LoginFormValues;

function getAuthorizationHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: 'Bearer ' + accessToken,
  };
}

export const authService = {
  async getCurrentUser(accessToken: string): Promise<AuthUser> {
    const response = await httpClient.requestJson<UserResponse>({
      headers: getAuthorizationHeaders(accessToken),
      method: 'GET',
      path: 'users/me',
    });

    return response.data;
  },
  async login(values: LoginFormValues): Promise<LoginResponse['data']> {
    const body: LoginRequest = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
    const response = await httpClient.requestJson<LoginResponse, LoginRequest>({
      body,
      method: 'POST',
      path: 'auth/login',
    });

    return response.data;
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
