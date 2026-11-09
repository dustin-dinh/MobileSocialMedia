import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PostDetailScreen } from '../features/feed/screens/PostDetailScreen';
import { PostLikesScreen } from '../features/feed/screens/PostLikesScreen';
import { SavedPostsScreen } from '../features/feed/screens/SavedPostsScreen';
import { ChatScreen } from '../features/messages/screens/ChatScreen';
import { NewMessageScreen } from '../features/messages/screens/NewMessageScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { FollowListScreen } from '../features/profile/screens/FollowListScreen';
import { FollowRequestsScreen } from '../features/profile/screens/FollowRequestsScreen';
import { ReelViewerScreen } from '../features/reel/screens/ReelViewerScreen';
import { StoryViewerScreen } from '../features/stories/screens/StoryViewerScreen';
import { StoryReactionsScreen } from '../features/stories/screens/StoryReactionsScreen';
import { UserProfileScreen } from '../features/profile/screens/UserProfileScreen';
import { AnonymousMessagesScreen } from '../features/settings/screens/AnonymousMessagesScreen';
import { BlockedUsersScreen } from '../features/settings/screens/BlockedUsersScreen';
import { MutedUsersScreen } from '../features/settings/screens/MutedUsersScreen';
import { ChangePasswordScreen } from '../features/settings/screens/ChangePasswordScreen';
import { DeleteAccountScreen } from '../features/settings/screens/DeleteAccountScreen';
import { LegalScreen } from '../features/settings/screens/LegalScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { TwoFactorScreen } from '../features/settings/screens/TwoFactorScreen';
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
    <Stack.Navigator
      initialRouteName="Tabs"
      // Android's default push is a short fade; slide like iOS so both platforms feel the same.
      screenOptions={{ animation: 'slide_from_right', headerShown: false }}
    >
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="PostLikes" component={PostLikesScreen} />
      <Stack.Screen
        name="ReelViewer"
        component={ReelViewerScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="FollowRequests" component={FollowRequestsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="StoryReactions" component={StoryReactionsScreen} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="MutedUsers" component={MutedUsersScreen} />
      <Stack.Screen name="AnonymousMessages" component={AnonymousMessagesScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
    </Stack.Navigator>
  );
}
