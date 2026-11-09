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
import { messageService } from '../../messages/services/messageService';

type PushData = {
  actorId?: string;
  commentId?: string | null;
  conversationId?: string;
  postId?: string | null;
  storyId?: string;
  type?: string;
};

let registeredToken: string | null = null;
let removeTapListener: (() => void) | null = null;
let loggedNoProjectId = false;
/** A tap that arrived before the signed-in screens were mounted (cold start, onboarding). */
let pendingTap: PushData | null = null;
let lastTapId: string | null = null;
const badgeParts = { messages: 0, notifications: 0 };

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

/** Opens the screen a tapped notification is about, once the signed-in stack is mounted. */
function openFromPush(data: PushData): void {
  if (!navigationRef.isReady() || !navigationRef.getRootState()?.routeNames.includes('Tabs')) {
    pendingTap = data;
    return;
  }

  pendingTap = null;

  if (data.type === 'MESSAGE' && data.conversationId) {
    void openConversation(data.conversationId);
  } else if (data.type === 'STORY_REACTION' && data.storyId) {
    navigationRef.navigate('StoryReactions', { storyId: data.storyId });
  } else if (data.type === 'FOLLOW_REQUEST') {
    navigationRef.navigate('FollowRequests');
  } else if ((data.type === 'FOLLOW' || data.type === 'FOLLOW_ACCEPT') && data.actorId) {
    navigationRef.navigate('UserProfile', { userId: data.actorId });
  } else if (data.postId) {
    navigationRef.navigate('PostDetail', {
      commentId: data.commentId ?? undefined,
      postId: data.postId,
    });
  } else {
    navigationRef.navigate('Notifications');
  }
}

/** The push carries only the id; Chat also needs the peer, so look the conversation up. */
async function openConversation(conversationId: string): Promise<void> {
  try {
    const conversation = (await messageService.list()).find((item) => item.id === conversationId);

    if (conversation) {
      navigationRef.navigate('Chat', { conversationId, peer: conversation.peer });
      return;
    }
  } catch {
    // Fall back to the inbox below.
  }

  navigationRef.navigate('Tabs', { screen: 'Messages' });
}

// Opens a tap held back until the signed-in stack mounted (cold start, birth-date or onboarding screen).
navigationRef.addListener('state', () => {
  if (pendingTap) {
    openFromPush(pendingTap);
  }
});

export const pushService = {
  /** Ask for permission, get this device's token and hand it to the backend. */
  async register(): Promise<void> {
    const Notifications = loadNotifications();

    if (!Notifications) {
      return;
    }

    try {
      // Android 8+ shows nothing without a channel, and Android 13 asks for permission only once one exists; iOS has no channels.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          importance: Notifications.AndroidImportance.HIGH,
          name: 'Thông báo',
        });
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      removeTapListener?.();
      // The listener and the launch response can report the same tap: open it once.
      const handleTap = (response: import('expo-notifications').NotificationResponse) => {
        if (response.notification.request.identifier !== lastTapId) {
          lastTapId = response.notification.request.identifier;
          openFromPush(response.notification.request.content.data as PushData);
        }
      };
      const subscription = Notifications.addNotificationResponseReceivedListener(handleTap);
      removeTapListener = () => subscription.remove();

      // The tap that launched the app from fully closed; cleared so the next sign-in does not replay it.
      const launchResponse = Notifications.getLastNotificationResponse();

      if (launchResponse) {
        Notifications.clearLastNotificationResponse();
        handleTap(launchResponse);
      }

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
    } catch (error) {
      // No EAS project id yet (accounts not set up): expected, say it once.
      if ((error as { code?: string }).code === 'ERR_NOTIFICATIONS_NO_EXPERIENCE_ID') {
        if (!loggedNoProjectId) {
          loggedNoProjectId = true;
          console.info('[pushService] No EAS projectId configured: push registration skipped.');
        }
        return;
      }

      // FCM / APNs credentials missing, or the network: push is optional.
      console.warn('[pushService] Push registration skipped:', error);
    }
  },

  /**
   * App icon badge = unread notifications + unread messages. iOS and launchers
   * that support badges show it; elsewhere this is a no-op.
   * shortcut: updated only while the app runs (the server sends no badge number), upgrade by adding `badge` to the push payload.
   */
  setBadge(part: keyof typeof badgeParts, value: number): void {
    badgeParts[part] = value;

    void loadNotifications()
      ?.setBadgeCountAsync(badgeParts.messages + badgeParts.notifications)
      .catch(() => undefined);
  },

  /** Stop pushes to this device for the account that is signing out. */
  async unregister(): Promise<void> {
    removeTapListener?.();
    removeTapListener = null;
    pendingTap = null;
    pushService.setBadge('messages', 0);
    pushService.setBadge('notifications', 0);

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
