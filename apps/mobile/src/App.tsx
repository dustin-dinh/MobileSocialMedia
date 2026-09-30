import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_600SemiBold_Italic,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { AuthSessionProvider, useAuthSession } from './features/auth/authSession';
import { SplashScreen } from './features/auth/screens/SplashScreen';
import { RootNavigator } from './navigation/RootNavigator';

function AppContent() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_600SemiBold_Italic,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const { isBootstrapping } = useAuthSession();

  if (isBootstrapping || !fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <AppContent />
      </AuthSessionProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
