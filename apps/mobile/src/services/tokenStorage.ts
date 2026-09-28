/**
 * Centralized token storage façade for the HTTP layer.
 *
 * The canonical storage implementation lives in features/auth (SecureStore-backed).
 * This module re-exports just the read path so httpClient can inject the Bearer
 * header without coupling to the auth feature's internal layout.
 */
import { authTokenStorage } from '../features/auth/services/authTokenStorage';

export const tokenStorage = {
  /** Retrieve the persisted access token, or null if none exists. */
  getToken(): Promise<string | null> {
    return authTokenStorage.get();
  },

  /** Remove the persisted access token (e.g. after a 401 forced-logout). */
  removeToken(): Promise<void> {
    return authTokenStorage.clear();
  },

  /** Persist an access token to secure storage. */
  saveToken(token: string): Promise<void> {
    return authTokenStorage.save(token);
  },
} as const;
