import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

type TemporaryNavigationMode = 'authenticated' | 'checking' | 'unauthenticated';

// TODO(Phase 5): Replace this navigation-only constant with real session bootstrap.
// It intentionally does not authenticate users, persist data, or call an API.
const TEMPORARY_NAVIGATION_MODE: TemporaryNavigationMode = 'unauthenticated';

export function RootNavigator() {
  if (TEMPORARY_NAVIGATION_MODE === 'checking') {
    return <AuthNavigator initialRouteName="Splash" />;
  }

  if (TEMPORARY_NAVIGATION_MODE === 'authenticated') {
    return <MainTabNavigator />;
  }

  return <AuthNavigator initialRouteName="Login" />;
}
