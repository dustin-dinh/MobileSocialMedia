import { StyleSheet, View } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import { authColors } from '../authTheme';

export function AuthDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <ClayText variant="caption" style={styles.text}>
        or
      </ClayText>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 12,
  },
  line: {
    backgroundColor: authColors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  text: {
    color: authColors.mutedText,
    marginHorizontal: 12,
  },
});
