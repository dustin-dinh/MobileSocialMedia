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
import { fontFamilies } from '../../../theme/typography';
import { clayDimensions } from '../../../theme/spacing';
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
                {count > 0 ? (
                  <View style={styles.countBadge}>
                    <ClayText variant="caption" style={styles.countBadgeText}>
                      {count}
                    </ClayText>
                  </View>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                hitSlop={12}
                onPress={onClose}
                style={styles.closeButton}
              >
                <ClayIcon name="X" size={16} weight="bold" color={clayColors.caption} />
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
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    width: 28,
  },
  countBadge: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: clayColors.border,
  },
  countBadgeText: {
    color: clayColors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamilies.bold,
  },
  handle: {
    backgroundColor: clayColors.border,
    borderRadius: 3,
    height: 5,
    width: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: clayColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
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
