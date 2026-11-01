import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/** Port the NestJS backend listens on in local development. */
const DEV_API_PORT = 3000;

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * In development the backend normally runs on the same computer that serves
 * the JS bundle, so its address can be read from where the bundle was loaded:
 * the LAN IP on a phone, `10.0.2.2` on an Android emulator. This keeps working
 * when the router hands the computer a new IP, which a hard-coded URL does not.
 *
 * Only used when `EXPO_PUBLIC_API_BASE_URL` is not set. Set that variable when
 * the backend is somewhere else (a deployed server, or Metro behind a tunnel).
 */
function getDevServerApiBaseUrl(): string | undefined {
  if (!__DEV__) {
    return undefined;
  }

  // Web has no SourceCode native module: the page itself is served by Metro on the dev machine.
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location?.hostname
      ? `http://${window.location.hostname}:${DEV_API_PORT}/api`
      : undefined;
  }

  try {
    // The registry is the new-architecture way in; `NativeModules` covers the old one.
    const sourceCode =
      (TurboModuleRegistry.get('SourceCode') as typeof NativeModules.SourceCode | null) ??
      NativeModules.SourceCode;
    const scriptUrl: unknown = sourceCode?.getConstants?.()?.scriptURL;
    const host = typeof scriptUrl === 'string' ? /^https?:\/\/([^:/]+)/.exec(scriptUrl)?.[1] : null;

    return host ? `http://${host}:${DEV_API_PORT}/api` : undefined;
  } catch {
    return undefined;
  }
}

export const apiConfig = {
  baseUrl: configuredApiBaseUrl
    ? removeTrailingSlashes(configuredApiBaseUrl)
    : getDevServerApiBaseUrl(),
} as const;

if (__DEV__ && process.env.NODE_ENV !== 'test') {
  // "Unable to reach the server" is almost always a wrong address: show which one is in use.
  console.log(`[api] Backend URL: ${apiConfig.baseUrl ?? 'not configured'}`);
}

export function getApiBaseUrl(): string {
  if (!apiConfig.baseUrl) {
    throw new Error(
      'The API URL is unknown: set EXPO_PUBLIC_API_BASE_URL (required outside local development).',
    );
  }

  return apiConfig.baseUrl;
}
