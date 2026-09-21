import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider } from './features/auth/authSession';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthSessionProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
