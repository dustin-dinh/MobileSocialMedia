import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
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

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastHost } from './components/common/toast';
import { AuthSessionProvider, useAuthSession } from './features/auth/authSession';
import { SplashScreen } from './features/auth/screens/SplashScreen';
import { linking, navigationRef } from './navigation/navigationRef';
import { RootNavigator } from './navigation/RootNavigator';
import { clayColors } from './theme/colors';

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
    <NavigationContainer linking={linking} ref={navigationRef} theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

// Screens sit on the app canvas while they animate; the default white flashes between them.
const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: clayColors.canvas },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthSessionProvider>
          <AppContent />
        </AuthSessionProvider>
        <ToastHost />
      </ErrorBoundary>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
