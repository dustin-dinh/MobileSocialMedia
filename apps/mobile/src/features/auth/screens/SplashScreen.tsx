import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authColors } from '../authTheme';
import { AuthBrand } from '../components/AuthBrand';

export function SplashScreen() {
  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <View style={styles.content}>
        <AuthBrand />
        <View style={styles.status}>
          <ActivityIndicator color={authColors.primary} size="small" />
          <Text style={styles.statusText}>Preparing your space</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  safeArea: {
    backgroundColor: authColors.background,
    flex: 1,
  },
  status: {
    alignItems: 'center',
    marginTop: 44,
  },
  statusText: {
    color: authColors.mutedText,
    fontSize: 14,
    marginTop: 12,
  },
});
