const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export const apiConfig = {
  baseUrl: configuredApiBaseUrl ? removeTrailingSlashes(configuredApiBaseUrl) : undefined,
} as const;

export function getApiBaseUrl(): string {
  if (!apiConfig.baseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  return apiConfig.baseUrl;
}
