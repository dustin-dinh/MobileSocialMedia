import { getGoogleWebClientId } from '../../../config/google';

export type GoogleSignInErrorCode =
  | 'cancelled'
  | 'in_progress'
  | 'play_services_unavailable'
  | 'unknown';

export class GoogleSignInError extends Error {
  readonly code: GoogleSignInErrorCode;

  constructor(code: GoogleSignInErrorCode, message: string) {
    super(message);
    this.name = 'GoogleSignInError';
    this.code = code;
  }
}

let isConfigured = false;

function getGoogleSigninModule() {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    throw new GoogleSignInError(
      'unknown',
      'Google Sign-In native module is not available in this environment.',
    );
  }
}

export const googleSignIn = {
  configure(webClientId?: string): void {
    const clientId = webClientId ?? getGoogleWebClientId();
    if (!clientId) {
      return;
    }

    if (isConfigured) {
      return;
    }

    const { GoogleSignin } = getGoogleSigninModule();
    GoogleSignin.configure({
      offlineAccess: false,
      webClientId: clientId,
    });
    isConfigured = true;
  },

  async signIn(): Promise<{ idToken: string }> {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      throw new GoogleSignInError(
        'unknown',
        'Google Client ID is not configured in this app.',
      );
    }

    this.configure(clientId);

    const { GoogleSignin, statusCodes } = getGoogleSigninModule();

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch {
      throw new GoogleSignInError(
        'play_services_unavailable',
        'Google Play Services is not available on this device.',
      );
    }

    try {
      const response = await GoogleSignin.signIn();

      // Support both v13+ response.data.idToken and legacy response.idToken
      const idToken =
        response?.data?.idToken ??
        response?.idToken ??
        (typeof response === 'object' && response !== null && 'idToken' in response
          ? (response as { idToken?: string }).idToken
          : undefined);

      if (!idToken || typeof idToken !== 'string') {
        throw new GoogleSignInError(
          'unknown',
          'No ID token received from Google Sign-In.',
        );
      }

      return { idToken };
    } catch (error: any) {
      if (error instanceof GoogleSignInError) {
        throw error;
      }

      const code = error?.code;
      if (code === statusCodes?.SIGN_IN_CANCELLED || code === '12501' || code === 12501) {
        throw new GoogleSignInError('cancelled', 'Sign in was cancelled.');
      }
      if (code === statusCodes?.IN_PROGRESS) {
        throw new GoogleSignInError('in_progress', 'Sign in is already in progress.');
      }
      if (code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleSignInError(
          'play_services_unavailable',
          'Google Play Services is not available or outdated.',
        );
      }

      throw new GoogleSignInError(
        'unknown',
        error?.message ?? 'Google Sign-In failed.',
      );
    }
  },

  async signOut(): Promise<void> {
    try {
      const { GoogleSignin } = getGoogleSigninModule();
      await GoogleSignin.signOut();
    } catch {
      // Best-effort cleanup, ignore error
    }
  },
} as const;
