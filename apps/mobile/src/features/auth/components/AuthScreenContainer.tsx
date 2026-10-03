import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { AuthBrand } from './AuthBrand';

type AuthScreenContainerProps = {
  children: ReactNode;
  footerActionLabel: string;
  footerPrompt: string;
  onFooterAction: () => void;
  subtitle: string;
  title: string;
};

export function AuthScreenContainer({
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
            <AuthBrand />
            <View style={styles.heading}>
              <ClayText variant="title" style={styles.title}>
                {title}
              </ClayText>
              <ClayText variant="body" style={styles.subtitle}>
                {subtitle}
              </ClayText>
            </View>

            <ClaySurface variant="card" style={styles.card}>
              {children}
            </ClaySurface>

            <View style={styles.footer}>
              <ClayText variant="body" style={styles.footerPrompt}>
                {footerPrompt}
              </ClayText>
              <Pressable
                accessibilityLabel={footerActionLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onFooterAction}
                style={styles.footerAction}
              >
                <ClayText variant="button" style={styles.footerActionText}>
                  {footerActionLabel}
                </ClayText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 28,
    padding: 24,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 480,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerAction: {
    minHeight: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  footerActionText: {
    color: clayColors.primary,
  },
  footerPrompt: {
    color: clayColors.caption,
  },
  heading: {
    alignItems: 'center',
    marginTop: 28,
  },
  keyboardAvoider: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  subtitle: {
    color: clayColors.caption,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
