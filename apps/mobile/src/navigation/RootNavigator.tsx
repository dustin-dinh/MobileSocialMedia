import { useAuthSession } from '../features/auth/authSession';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const { user } = useAuthSession();

  if (user) {
    return <MainTabNavigator />;
  }

  return <AuthNavigator />;
}
