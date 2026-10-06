import { USE_MOCK_API } from './runtime';

const configuredGoogleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

export function getGoogleWebClientId(): string | undefined {
  return configuredGoogleWebClientId || undefined;
}

export function isGoogleSignInAvailable(): boolean {
  return !USE_MOCK_API && Boolean(getGoogleWebClientId());
}
