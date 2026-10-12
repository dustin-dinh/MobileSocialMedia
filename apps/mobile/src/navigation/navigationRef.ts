import { createNavigationContainerRef, type LinkingOptions } from '@react-navigation/native';

import type { MainStackParamList } from './types';

/** Lets code outside the React tree (push notification taps) navigate. */
export const navigationRef = createNavigationContainerRef<MainStackParamList>();

/**
 * Links copied from the share sheet: `mobilesocial://p/<postId>` and
 * `mobilesocial://u/<userId>`. The scheme is declared in app.json.
 */
export const linking: LinkingOptions<MainStackParamList> = {
  config: {
    screens: {
      PostDetail: 'p/:postId',
      UserProfile: 'u/:userId',
    },
  },
  prefixes: ['mobilesocial://'],
};
