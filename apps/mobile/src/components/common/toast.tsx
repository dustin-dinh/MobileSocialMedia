import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clayColors } from '../../theme/colors';
import { clayRadii, claySpacing } from '../../theme/spacing';
import { ClayIcon } from '../icons/ClayIcon';
import { ClaySurface } from '../ui/ClaySurface';
import { ClayText } from '../ui/ClayText';

type ToastTone = 'error' | 'success';
type Toast = { id: number; text: string; tone: ToastTone };

const VISIBLE_MS = 2_600;
let listener: ((toast: Toast) => void) | null = null;
let nextId = 1;

/**
 * Show a short pop-up message above the tab bar. Safe to call from anywhere
 * (services, event handlers); it is a no-op until `ToastHost` is mounted.
 */
export function showToast(text: string, tone: ToastTone = 'success'): void {
  listener?.({ id: nextId++, text, tone });
}

/** Mount once near the app root. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    listener = setToast;

    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.timing(opacity, { duration: 160, toValue: 1, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { duration: 200, toValue: 0, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) {
            setToast((current) => (current?.id === toast.id ? null : current));
          }
        },
      );
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [opacity, toast]);

  if (!toast) {
    return null;
  }

  const isError = toast.tone === 'error';

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[styles.host, { bottom: insets.bottom + 104, opacity }]}
    >
      <ClaySurface variant="raised" style={styles.toast}>
        <ClayIcon
          color={isError ? clayColors.error : clayColors.success}
          name={isError ? 'WarningCircle' : 'Check'}
          size={18}
          weight="bold"
        />
        <ClayText variant="caption" style={styles.text}>
          {toast.text}
        </ClayText>
      </ClaySurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    alignItems: 'center',
    left: claySpacing.base,
    position: 'absolute',
    right: claySpacing.base,
  },
  text: {
    color: clayColors.text,
    flexShrink: 1,
  },
  toast: {
    alignItems: 'center',
    borderRadius: clayRadii.pill,
    flexDirection: 'row',
    gap: claySpacing.sm,
    paddingHorizontal: claySpacing.base,
    paddingVertical: claySpacing.md,
  },
});
