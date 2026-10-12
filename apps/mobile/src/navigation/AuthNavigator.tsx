import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { NewPasswordScreen } from '../features/auth/screens/NewPasswordScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { VerifyCodeScreen } from '../features/auth/screens/VerifyCodeScreen';
import { introStorage } from '../features/onboarding/introStorage';
import { IntroScreen } from '../features/onboarding/screens/IntroScreen';
import { LegalScreen } from '../features/settings/screens/LegalScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  // null while the "intro already seen" flag is being read from storage.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    void introStorage.hasSeen().then(setIntroSeen);
  }, []);

  if (introSeen === null) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={introSeen ? 'Login' : 'Intro'}
      screenOptions={{ animation: 'slide_from_right', headerShown: false }}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}
