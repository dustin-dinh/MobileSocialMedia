import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_400Regular_Italic,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastHost } from './components/common/toast';
import { AuthSessionProvider, useAuthSession } from './features/auth/authSession';
import { SplashScreen } from './features/auth/screens/SplashScreen';
import { linking, navigationRef } from './navigation/navigationRef';
import { RootNavigator } from './navigation/RootNavigator';
import { clayColors } from './theme/colors';

function AppContent() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_400Regular_Italic,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  const { isBootstrapping } = useAuthSession();

  if (isBootstrapping || !fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.frame}>
      <View style={styles.column}>
        <NavigationContainer linking={linking} ref={navigationRef} theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </View>
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

// Web only: on a wide window the phone layout sits in a centred 640px column
// instead of stretching; on Android and iOS the column is the whole screen.
const styles = StyleSheet.create({
  column: Platform.select({
    web: { alignSelf: 'center', flex: 1, maxWidth: 640, width: '100%' },
    default: { flex: 1 },
  }),
  frame: { backgroundColor: clayColors.canvas, flex: 1 },
});
