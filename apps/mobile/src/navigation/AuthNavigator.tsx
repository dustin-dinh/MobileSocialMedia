import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import type { AuthStackParamList } from './types';

type AuthNavigatorProps = {
  initialRouteName: keyof AuthStackParamList;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator({ initialRouteName }: AuthNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
