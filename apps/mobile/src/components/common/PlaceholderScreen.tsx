import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PlaceholderScreenProps = {
  children?: ReactNode;
  description?: string;
  title: string;
};

export function PlaceholderScreen({
  children,
  description,
  title,
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children ? <View style={styles.actions}>{children}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 24,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  description: {
    color: '#4B5563',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
