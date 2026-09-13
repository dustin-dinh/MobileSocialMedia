import { StyleSheet, Text, View } from 'react-native';

import { authColors, authRadii } from '../authTheme';

export function AuthBrand() {
  return (
    <View style={styles.container}>
      <View accessible={false} style={styles.mark}>
        <Text style={styles.markText}>MS</Text>
      </View>
      <Text style={styles.name}>Mobile Social</Text>
      <Text style={styles.tagline}>Share moments. Stay connected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    backgroundColor: authColors.primary,
    borderRadius: authRadii.mark,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  markText: {
    color: authColors.primaryText,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  name: {
    color: authColors.title,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  tagline: {
    color: authColors.mutedText,
    fontSize: 14,
    marginTop: 4,
  },
});
