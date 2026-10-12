import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PostDetailScreen } from '../features/feed/screens/PostDetailScreen';
import { PostLikesScreen } from '../features/feed/screens/PostLikesScreen';
import { SavedPostsScreen } from '../features/feed/screens/SavedPostsScreen';
import { FollowListScreen } from '../features/profile/screens/FollowListScreen';
import { UserProfileScreen } from '../features/profile/screens/UserProfileScreen';
import { BlockedUsersScreen } from '../features/settings/screens/BlockedUsersScreen';
import { ChangePasswordScreen } from '../features/settings/screens/ChangePasswordScreen';
import { DeleteAccountScreen } from '../features/settings/screens/DeleteAccountScreen';
import { LegalScreen } from '../features/settings/screens/LegalScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * The signed-in app: the tab bar plus every screen that opens on top of it
 * (other profiles, a post, settings...). The tabs stay the first screen, so
 * the tab bar itself is unchanged.
 */
export function MainStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PostLikes" component={PostLikesScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}
