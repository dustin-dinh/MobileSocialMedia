import { createNavigationContainerRef, type LinkingOptions } from '@react-navigation/native';

import type { MainStackParamList } from './types';

/** Lets code outside the React tree (push notification taps) navigate. */
export const navigationRef = createNavigationContainerRef<MainStackParamList>();

/**
 * Links copied from the share sheet: `mobilesocial://p/<postId>` and
 * `mobilesocial://u/<userId>`. The scheme is declared in app.json.
 * The other paths give each screen its own address on the web build.
 */
export const linking: LinkingOptions<MainStackParamList> = {
  config: {
    screens: {
      Tabs: {
        screens: { Home: '', Search: 'search', Create: 'create', Messages: 'messages', Profile: 'me' },
      },
      PostDetail: 'p/:postId',
      UserProfile: 'u/:userId',
      Notifications: 'notifications',
      SavedPosts: 'saved',
      Settings: 'settings',
      ChangePassword: 'settings/password',
      BlockedUsers: 'settings/blocked',
      MutedUsers: 'settings/muted',
      AnonymousMessages: 'settings/anonymous',
      DeleteAccount: 'settings/delete',
      TwoFactor: 'settings/2fa',
      Legal: 'legal/:doc',
      FollowRequests: 'follow-requests',
      NewMessage: 'messages/new',
    },
  },
  prefixes: ['mobilesocial://'],
};
