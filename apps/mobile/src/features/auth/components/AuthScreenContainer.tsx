import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { AuthBrand } from './AuthBrand';

type AuthScreenContainerProps = {
  /** One line under the lockup saying what the product is (Login only). */
  about?: string;
  /** Replaces the lockup with a back link on screens deeper in a flow. */
  back?: { label: string; onPress: () => void };
  children: ReactNode;
  footerActionLabel?: string;
  footerPrompt?: string;
  onFooterAction?: () => void;
  subtitle?: string;
  title: string;
};

/** Signed-out frame: lockup or back link, the screen's h1, the form, and a footer link at the bottom. */
export function AuthScreenContainer({
  about,
  back,
  children,
  footerActionLabel,
  footerPrompt,
  onFooterAction,
  subtitle,
  title,
}: AuthScreenContainerProps) {
  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.topRow}>
              {back ? (
                <Pressable
                  accessibilityLabel="Back"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={back.onPress}
                  style={styles.back}
                >
                  <ClayIcon color={clayColors.text} name="CaretLeft" size={20} />
                  <ClayText variant="button" style={styles.backText}>
                    {back.label}
                  </ClayText>
                </Pressable>
              ) : (
                <AuthBrand />
              )}
            </View>
            {about ? (
              <ClayText variant="body" style={styles.about}>
                {about}
              </ClayText>
            ) : null}

            <View style={styles.heading}>
              <ClayText level={1} variant="title">
                {title}
              </ClayText>
              {subtitle ? (
                <ClayText variant="body" style={styles.subtitle}>
                  {subtitle}
                </ClayText>
              ) : null}
            </View>

            {children}

            {footerActionLabel && onFooterAction ? (
              <View style={styles.footer}>
                {footerPrompt ? (
                  <ClayText variant="body" style={styles.secondaryText}>
                    {footerPrompt}
                  </ClayText>
                ) : null}
                <Pressable
                  accessibilityLabel={footerActionLabel}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onFooterAction}
                  style={styles.footerAction}
                >
                  <ClayText variant="button" style={styles.link}>
                    {footerActionLabel}
                  </ClayText>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  about: {
    color: clayColors.textSecondary,
    marginTop: 12,
  },
  back: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginLeft: -4,
    minHeight: clayDimensions.minTouchTarget,
  },
  backText: {
    color: clayColors.text,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 480,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    // Sits at the bottom of a tall screen, 24 below the form on a short one.
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerAction: {
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
  },
  heading: {
    marginBottom: 24,
    marginTop: 24,
  },
  keyboardAvoider: {
    flex: 1,
  },
  link: {
    color: clayColors.primaryInk,
  },
  safeArea: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: 8,
  },
  secondaryText: {
    color: clayColors.textSecondary,
  },
  subtitle: {
    color: clayColors.textSecondary,
    marginTop: 8,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: clayDimensions.minTouchTarget,
  },
});
