import { useAuthSession } from '../features/auth/authSession';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const { isAuthenticated } = useAuthSession();

  if (isAuthenticated) {
    return <MainTabNavigator />;
  }

  return <AuthNavigator />;
}
