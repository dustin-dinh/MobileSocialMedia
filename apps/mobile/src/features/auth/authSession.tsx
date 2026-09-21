import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { ApiError } from '../../services/apiError';
import { authService, type AuthUser } from './services/authService';
import { authTokenStorage } from './services/authTokenStorage';
import type { LoginFormValues } from './validation';

type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

type AuthSessionContextValue = {
  isBootstrapping: boolean;
  signIn: (values: LoginFormValues) => Promise<void>;
  signOut: () => Promise<void>;
  user: AuthUser | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
const SESSION_BOOTSTRAP_TIMEOUT_MS = 5_000;

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

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
      isBootstrapping,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [isBootstrapping, session, signIn, signOut],
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
