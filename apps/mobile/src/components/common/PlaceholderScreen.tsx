import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClayText } from '../ui/ClayText';
import { clayColors } from '../../theme';

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
        <ClayText variant="title" style={styles.title}>
          {title}
        </ClayText>
        {description ? (
          <ClayText variant="body" style={styles.description}>
            {description}
          </ClayText>
        ) : null}
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
    color: clayColors.caption,
    marginTop: 12,
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  title: {
    color: clayColors.text,
    textAlign: 'center',
  },
});

