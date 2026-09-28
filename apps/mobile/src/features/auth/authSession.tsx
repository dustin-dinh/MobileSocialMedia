import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { ApiError } from '../../services/apiError';
import { authService, type AuthUser } from './services/authService';
import { authTokenStorage } from './services/authTokenStorage';
import type { LoginFormValues, RegisterFormValues } from './validation';

type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

type AuthSessionContextValue = {
  /** The current access token, or null when signed out. */
  accessToken: string | null;
  /** Whether the initial session restore has completed. */
  isBootstrapping: boolean;
  /** Convenience boolean – true when a valid session exists. */
  isAuthenticated: boolean;
  /**
   * Register a new account.
   * On success the user is NOT auto-signed-in; the caller should navigate to
   * the Login screen so the user confirms their credentials.
   */
  register: (values: RegisterFormValues) => Promise<AuthUser>;
  /** Sign in with email + password. Persists the token in SecureStore. */
  signIn: (values: LoginFormValues) => Promise<void>;
  /** Sign out: calls the API, clears storage and resets state. */
  signOut: () => Promise<void>;
  /** The authenticated user profile, or null when signed out. */
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const SESSION_BOOTSTRAP_TIMEOUT_MS = 5_000;

// Set to true to bypass login and jump straight to MainTabNavigator for UI testing.
export const BYPASS_AUTH_FOR_TESTING = true;

const MOCK_TEST_USER: AuthUser = {
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=face',
  bio: 'Mobile Developer | React Native & Expo 📱✨',
  displayName: 'Nguyễn Nhật Luân',
  email: 'nhatluan@example.com',
  id: 'user-001',
  username: 'nhatluan',
};

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [isBootstrapping, setIsBootstrapping] = useState(!BYPASS_AUTH_FOR_TESTING);
  const [session, setSession] = useState<AuthSession | null>(
    BYPASS_AUTH_FOR_TESTING
      ? { accessToken: 'mock-test-access-token', user: MOCK_TEST_USER }
      : null,
  );

  const clearSession = useCallback(async () => {
    await authTokenStorage.clear();
    setSession(null);
  }, []);

  const signIn = useCallback(async (values: LoginFormValues) => {
    const loginResult = await authService.login(values);

    await authTokenStorage.save(loginResult.accessToken);

    try {
      const user = await authService.getCurrentUser(loginResult.accessToken);

      setSession({
        accessToken: loginResult.accessToken,
        user,
      });
    } catch (error) {
      try {
        await authTokenStorage.clear();
      } catch {
        // Keep the original API error for the form to display.
      }

      setSession(null);
      throw error;
    }
  }, []);

  const register = useCallback(async (values: RegisterFormValues): Promise<AuthUser> => {
    return authService.register(values);
  }, []);

  const signOut = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      await authService.logout(session.accessToken);
    } catch (error) {
      if (!(error instanceof ApiError && error.kind === 'unauthorized')) {
        throw error;
      }
    }

    await clearSession();
  }, [clearSession, session]);

  useEffect(() => {
    if (BYPASS_AUTH_FOR_TESTING) {
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;
    let didTimeout = false;
    const bootstrapController = new AbortController();
    const bootstrapTimeoutId = setTimeout(() => {
      didTimeout = true;
      bootstrapController.abort();

      if (isMounted) {
        setIsBootstrapping(false);
      }
    }, SESSION_BOOTSTRAP_TIMEOUT_MS);

    const restoreSession = async () => {
      try {
        const accessToken = await authTokenStorage.get();

        if (didTimeout || !accessToken) {
          return;
        }

        const user = await authService.getCurrentUser(accessToken, {
          signal: bootstrapController.signal,
          timeoutMs: SESSION_BOOTSTRAP_TIMEOUT_MS,
        });

        if (isMounted && !didTimeout) {
          setSession({ accessToken, user });
        }
      } catch (error) {
        if (error instanceof ApiError && error.kind === 'unauthorized') {
          try {
            await authTokenStorage.clear();
          } catch {
            // A future app launch can retry clearing an expired token.
          }
        }
      } finally {
        clearTimeout(bootstrapTimeoutId);

        if (isMounted && !didTimeout) {
          setIsBootstrapping(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
      didTimeout = true;
      clearTimeout(bootstrapTimeoutId);
      bootstrapController.abort();
    };
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      accessToken: session?.accessToken ?? null,
      isAuthenticated: session !== null,
      isBootstrapping,
      register,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [isBootstrapping, register, session, signIn, signOut],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return context;
}
