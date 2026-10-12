import * as SecureStore from 'expo-secure-store';

// SecureStore is already a dependency (it holds the access token), so the
// "intro seen" flag lives there instead of pulling in another storage library.
const INTRO_SEEN_KEY = 'intro_seen_v1';

export const introStorage = {
  /** False when the flag cannot be read: showing the intro again is harmless. */
  async hasSeen(): Promise<boolean> {
    try {
      return (await SecureStore.getItemAsync(INTRO_SEEN_KEY)) === '1';
    } catch {
      return false;
    }
  },

  async markSeen(): Promise<void> {
    try {
      await SecureStore.setItemAsync(INTRO_SEEN_KEY, '1');
    } catch {
      // Not being able to persist the flag only means the intro shows once more.
    }
  },
} as const;
