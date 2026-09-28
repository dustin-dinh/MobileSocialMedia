import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { searchColors, searchRadii } from '../searchTheme';

const SKELETON_ITEMS = [1, 2, 3, 4, 5];

export function SearchSkeleton() {
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
            <View style={styles.titleLine} />
            <View style={styles.subtitleLine} />
            <View style={styles.bioLine} />
          </View>
          <View style={styles.buttonSkeleton} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSkeleton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 25,
    height: 50,
    width: 50,
  },
  bioLine: {
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    height: 10,
    marginTop: 4,
    width: '60%',
  },
  buttonSkeleton: {
    backgroundColor: '#E2E8F0',
    borderRadius: searchRadii.button,
    height: 34,
    width: 88,
  },
  container: {
    paddingTop: 8,
  },
  infoSkeleton: {
    flex: 1,
    marginHorizontal: 12,
  },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: searchColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  subtitleLine: {
    backgroundColor: '#EEF2F6',
    borderRadius: 4,
    height: 11,
    marginTop: 6,
    width: '40%',
  },
  titleLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    height: 14,
    width: '70%',
  },
});
