import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clayColors } from '../../../theme/colors';
import { ClayText } from '../../../components/ui/ClayText';
import { AuthBrand } from '../components/AuthBrand';

const DOT_COUNT = 3;
const DOT_SIZE = 10;
const DOT_SPACING = 14;
const ANIMATION_DURATION = 600;

function LoadingDots() {
  const animations = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const staggeredAnimations = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * (ANIMATION_DURATION / DOT_COUNT)),
          Animated.timing(anim, {
            duration: ANIMATION_DURATION,
            easing: Easing.inOut(Easing.ease),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            duration: ANIMATION_DURATION,
            easing: Easing.inOut(Easing.ease),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    Animated.parallel(staggeredAnimations).start();

    return () => {
      staggeredAnimations.forEach((a) => a.stop());
    };
  }, [animations]);

  return (
    <View style={styles.dotsRow}>
      {animations.map((anim, index) => {
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.4],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      duration: 500,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <AuthBrand />
        <View style={styles.status}>
          <LoadingDots />
          <ClayText variant="caption" style={styles.statusText}>
            Preparing your space
          </ClayText>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  dot: {
    backgroundColor: clayColors.primary,
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
    marginHorizontal: DOT_SPACING / 2,
    width: DOT_SIZE,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  status: {
    alignItems: 'center',
    marginTop: 44,
  },
  statusText: {
    color: clayColors.caption,
    marginTop: 16,
  },
});
