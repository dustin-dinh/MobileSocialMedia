import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useIsScreenFocused } from '../../../navigation/useIsScreenFocused';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { ReelsFeed } from './ReelsFeed';

type ReelViewerScreenProps = NativeStackScreenProps<MainStackParamList, 'ReelViewer'>;

/**
 * Full-screen reels opened from a video in a post: plays that video first,
 * then the recommended reels. Back returns to where the video was tapped.
 */
export function ReelViewerScreen({ route }: ReelViewerScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const isFocused = useIsScreenFocused();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ReelsFeed
        bottomInset={insets.bottom + 12}
        initialPost={route.params.post}
        isActive={isFocused}
      />
      <Pressable
        accessibilityLabel="Quay lại"
        accessibilityRole="button"
        hitSlop={8}
        onPress={navigation.back}
        style={[styles.backButton, { top: insets.top + 12 }]}
      >
        <ClayIcon color={clayColors.onPrimary} name="CaretLeft" size={22} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: clayDimensions.minTouchTarget / 2,
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    width: clayDimensions.minTouchTarget,
  },
  container: {
    backgroundColor: clayColors.text,
    flex: 1,
  },
});
