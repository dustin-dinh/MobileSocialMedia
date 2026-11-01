import { useAuthSession } from '../features/auth/authSession';
import { BirthDateScreen } from '../features/auth/screens/BirthDateScreen';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';

export function RootNavigator() {
  const { isAuthenticated, user } = useAuthSession();

  // 18+ app: an account without a declared birth date (`null`, not undefined) declares it first.
  if (isAuthenticated && user?.birthDate === null) {
    return <BirthDateScreen />;
  }

  // `null` (not undefined) means the server says the first-run setup is still pending.
  if (isAuthenticated && user?.onboardedAt === null) {
    return <OnboardingScreen />;
  }

  if (isAuthenticated) {
    return <MainStackNavigator />;
  }

  return <AuthNavigator />;
}
