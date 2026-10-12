import { useAuthSession } from '../features/auth/authSession';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';

export function RootNavigator() {
  const { isAuthenticated, user } = useAuthSession();

  // `null` (not undefined) means the server says the first-run setup is still pending.
  if (isAuthenticated && user?.onboardedAt === null) {
    return <OnboardingScreen />;
  }

  if (isAuthenticated) {
    return <MainStackNavigator />;
  }

  return <AuthNavigator />;
}
