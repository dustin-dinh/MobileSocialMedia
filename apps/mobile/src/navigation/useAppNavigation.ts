import { NavigationContext, StackActions } from '@react-navigation/native';
import { useContext, useMemo } from 'react';

import { showToast } from '../components/common/toast';
import { useAuthSession } from '../features/auth/authSession';
import { followApi } from '../services/followApi';
import type { MainStackParamList, MainTabParamList } from './types';

/**
 * Navigation helpers for screens pushed on top of the tabs.
 *
 * Reads the navigation object from context instead of `useNavigation()` so
 * that components rendered without a navigator (unit tests, previews) get
 * no-op helpers instead of a crash.
 */
export function useAppNavigation() {
  const navigation = useContext(NavigationContext);
  const { user } = useAuthSession();
  const currentUserId = user?.id;

  return useMemo(() => {
    // `push` (not `navigate`) so that opening profile B from profile A stacks
    // a new screen instead of replacing A's params.
    const open = <K extends keyof MainStackParamList>(
      name: K,
      ...params: MainStackParamList[K] extends undefined ? [] : [MainStackParamList[K]]
    ) => {
      navigation?.dispatch(StackActions.push(name, params[0]));
    };

    const replace = <K extends keyof MainStackParamList>(
      name: K,
      ...params: MainStackParamList[K] extends undefined ? [] : [MainStackParamList[K]]
    ) => {
      navigation?.dispatch(StackActions.replace(name, params[0]));
    };

    const openProfile = (userId: string) => {
      if (userId === currentUserId) {
        navigation?.navigate('Tabs', { screen: 'Profile' });
      } else {
        open('UserProfile', { userId });
      }
    };

    return {
      back: () => {
        if (navigation?.canGoBack()) {
          navigation.goBack();
        }
      },
      open,
      /** Shows posts containing `#tag` in the Search tab. */
      openHashtag: (tag: string) => {
        navigation?.navigate('Tabs', { params: { query: `#${tag}` }, screen: 'Search' });
      },
      /** Opens the profile behind an `@username` mention. */
      openMention: (username: string) => {
        followApi
          .findUserIdByUsername(username)
          .then((userId) => {
            if (userId) {
              openProfile(userId);
            } else {
              showToast(`Không tìm thấy @${username}`, 'error');
            }
          })
          .catch(() => showToast('Không mở được trang cá nhân.', 'error'));
      },
      /** Opens a user's profile; your own profile is the Profile tab. */
      openProfile,
      /** Switches to one of the bottom tabs. */
      openTab: (screen: keyof MainTabParamList) => {
        navigation?.navigate('Tabs', { screen });
      },
      /** Like `open`, but the current screen is removed from the stack. */
      replace,
    };
  }, [currentUserId, navigation]);
}
