import { StyleSheet, Text, View } from 'react-native';

import { feedColors } from '../feedTheme';

export function FeedEmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📭</Text>
      <Text style={styles.title}>Your feed is empty</Text>
      <Text style={styles.subtitle}>
        Follow people and topics you're interested in to fill your feed with great content.
      </Text>
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
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  subtitle: {
    color: feedColors.caption,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: feedColors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
