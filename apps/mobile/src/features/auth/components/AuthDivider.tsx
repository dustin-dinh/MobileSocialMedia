import { StyleSheet, View } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';

export function AuthDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <ClayText variant="caption" style={styles.text}>
        hoặc
      </ClayText>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 16,
  },
  line: {
    backgroundColor: clayColors.border,
    flex: 1,
    height: 1,
  },
  text: {
    marginHorizontal: 12,
  },
});
