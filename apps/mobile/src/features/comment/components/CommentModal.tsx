import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Post } from '../../feed/types';
import { commentColors, commentRadii } from '../commentTheme';
import { clayColors } from '../../../theme/colors';
import { tabularNums } from '../../../theme/typography';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { ToastHost } from '../../../components/common/toast';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { CommentThread } from './CommentThread';

// ---------------------------------------------------------------------------
// CommentModal Component
// ---------------------------------------------------------------------------

export type CommentModalProps = {
  onClose: () => void;
  post: Post | null;
  visible: boolean;
};

/** Bottom sheet hosting the comment thread of a post. */
export function CommentModal({ onClose, post, visible }: CommentModalProps) {
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(post?.commentsCount ?? 0);

  useEffect(() => {
    setCount(post?.commentsCount ?? 0);
  }, [post?.id]);

  if (!visible || !post) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        {/* Backdrop dismiss */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss comments sheet"
          style={styles.backdropPressable}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ClaySurface variant="modal" style={styles.sheet}>
            {/* ── Handle Bar ───────────────────────────────── */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* ── Header ───────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <ClayText variant="heading" style={styles.headerTitle}>
                  Bình luận
                </ClayText>
                <ClayText variant="caption" style={tabularNums}>
                  {count}
                </ClayText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                hitSlop={12}
                onPress={onClose}
                style={styles.closeButton}
              >
                <ClayIcon name="X" size={20} color={clayColors.text} />
              </Pressable>
            </View>

            <CommentThread
              bottomInset={Math.max(insets.bottom, 12)}
              onBeforeNavigate={onClose}
              onCountChange={setCount}
              post={post}
            />
          </ClaySurface>
        </KeyboardAvoidingView>
        <ToastHost bottomOffset={88} />
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdropPressable: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    // The glyph, not its touch area, lines up with the right margin.
    marginRight: -12,
    width: clayDimensions.minTouchTarget,
  },
  handle: {
    backgroundColor: clayColors.control,
    borderRadius: 2,
    height: 4,
    width: 36,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: clayColors.rule,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    paddingHorizontal: clayDimensions.gutter,
  },
  headerTitle: {
    color: clayColors.text,
  },
  headerTitleWrap: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: claySpacing.sm,
  },
  keyboardContainer: {
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: commentColors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: clayColors.surface,
    borderTopLeftRadius: commentRadii.modal,
    borderTopRightRadius: commentRadii.modal,
    height: '75%',
    maxHeight: '85%',
    padding: 0,
  },
});
