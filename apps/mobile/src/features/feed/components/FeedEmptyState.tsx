import { StyleSheet, View } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayText } from '../../../components/ui/ClayText';

export function FeedEmptyState() {
  return (
    <View style={styles.container}>
      <ClayEmoji name="sparkles" size={68} />
      <ClayText variant="heading" style={styles.title}>
        Your feed is empty
      </ClayText>
      <ClayText variant="body" style={styles.subtitle}>
        Follow people and topics you're interested in to fill your feed with great content.
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  subtitle: {
    color: clayColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: clayColors.text,
    marginTop: 16,
    textAlign: 'center',
  },
});
