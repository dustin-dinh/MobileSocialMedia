import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'mobile-social-network.auth.access-token';

export const authTokenStorage = {
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },
  get(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  save(accessToken: string): Promise<void> {
    return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  },
} as const;
