import { useAuthSession } from '../features/auth/authSession';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export function RootNavigator() {
  const { isBootstrapping, user } = useAuthSession();

  if (isBootstrapping) {
    return <AuthNavigator initialRouteName="Splash" />;
  }

  if (user) {
    return <MainTabNavigator />;
  }

  return <AuthNavigator initialRouteName="Login" />;
}
