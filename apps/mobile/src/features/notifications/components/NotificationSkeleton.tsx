import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { notificationsColors, notificationsRadii } from '../notificationsTheme';

const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6];

export function NotificationSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          duration: 700,
          toValue: 0.85,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          duration: 700,
          toValue: 0.4,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {SKELETON_ITEMS.map((item) => (
        <Animated.View key={item} style={[styles.skeletonRow, { opacity: pulseAnim }]}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.infoSkeleton}>
            <View style={styles.line1} />
            <View style={styles.line2} />
          </View>
          <View style={styles.rightSkeleton} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    backgroundColor: notificationsColors.surfaceWell,
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  container: {
    paddingTop: 4,
  },
  infoSkeleton: {
    flex: 1,
    marginHorizontal: 12,
  },
  line1: {
    backgroundColor: notificationsColors.surfaceWell,
    borderRadius: 4,
    height: 14,
    width: '80%',
  },
  line2: {
    backgroundColor: notificationsColors.border,
    borderRadius: 4,
    height: 10,
    marginTop: 6,
    width: '40%',
  },
  rightSkeleton: {
    backgroundColor: notificationsColors.surfaceWell,
    borderRadius: notificationsRadii.postThumb,
    height: 40,
    width: 40,
  },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: notificationsColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
