import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clayColors } from '../../../theme/colors';
import { AuthBrand } from '../components/AuthBrand';

/** Shown while the saved session is read: the lockup and a spinner, nothing that performs. */
export function SplashScreen() {
  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <View style={styles.content}>
        <AuthBrand level={1} />
        <ActivityIndicator
          accessibilityLabel="Đang mở Mobile Social"
          color={clayColors.caption}
          style={styles.spinner}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  spinner: {
    marginTop: 24,
  },
});
