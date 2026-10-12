import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../features/feed/screens/HomeScreen';
import { ConversationsScreen } from '../features/messages/screens/ConversationsScreen';
import { CreateScreen } from '../features/post/screens/CreateScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { SearchScreen } from '../features/search/screens/SearchScreen';
import { ClayTabBar } from './ClayTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ClayTabBar {...props} />}
      // Cross-fade between tabs instead of an instant swap.
      screenOptions={{ animation: 'fade', headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ title: 'Create' }} />
      <Tab.Screen name="Messages" component={ConversationsScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
