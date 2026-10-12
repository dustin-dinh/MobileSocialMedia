/**
 * Push notifications (Expo push service).
 *
 * Needs a development or production build with an EAS project id and FCM
 * credentials; in Expo Go, in mock mode or without that setup every function
 * here quietly does nothing, and the in-app realtime channel keeps working.
 */
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { USE_MOCK_API } from '../../../config/runtime';
import { navigationRef } from '../../../navigation/navigationRef';
import { httpClient } from '../../../services/httpClient';

type PushData = { actorId?: string; commentId?: string | null; postId?: string | null; type?: string };

let registeredToken: string | null = null;
let removeTapListener: (() => void) | null = null;

/**
 * Loaded on demand: importing expo-notifications inside Expo Go on Android
 * logs an error, and the app has to keep running there.
 */
function loadNotifications(): typeof import('expo-notifications') | null {
  if (USE_MOCK_API || isRunningInExpoGo()) {
    return null;
  }

  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/** Opens the screen a tapped notification is about. */
function openFromPush(data: PushData): void {
  if (!navigationRef.isReady()) {
    return;
  }

  if (data.type === 'FOLLOW' && data.actorId) {
    navigationRef.navigate('UserProfile', { userId: data.actorId });
  } else if (data.postId) {
    navigationRef.navigate('PostDetail', {
      commentId: data.commentId ?? undefined,
      postId: data.postId,
    });
  }
}

export const pushService = {
  /** Ask for permission, get this device's token and hand it to the backend. */
  async register(): Promise<void> {
    const Notifications = loadNotifications();

    if (!Notifications) {
      return;
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const current = await Notifications.getPermissionsAsync();
      const permission = current.granted
        ? current
        : await Notifications.requestPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync();

      await httpClient.requestVoid<{ platform: string; token: string }>({
        body: { platform: Platform.OS === 'ios' ? 'ios' : 'android', token },
        method: 'POST',
        path: 'notifications/devices',
      });
      registeredToken = token;

      removeTapListener?.();
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        openFromPush(response.notification.request.content.data as PushData);
      });
      removeTapListener = () => subscription.remove();
    } catch (error) {
      // Missing EAS project id / FCM setup, or the network: push is optional.
      console.warn('[pushService] Push registration skipped:', error);
    }
  },

  /** Stop pushes to this device for the account that is signing out. */
  async unregister(): Promise<void> {
    removeTapListener?.();
    removeTapListener = null;

    if (!registeredToken) {
      return;
    }

    const token = registeredToken;

    registeredToken = null;

    try {
      await httpClient.requestVoid({
        method: 'DELETE',
        path: `notifications/devices?token=${encodeURIComponent(token)}`,
      });
    } catch {
      // The session is ending anyway; a stale token only costs one failed push.
    }
  },
} as const;
