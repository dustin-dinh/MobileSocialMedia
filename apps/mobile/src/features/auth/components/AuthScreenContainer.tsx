import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authColors, authRadii } from '../authTheme';
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
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.card}>{children}</View>
            <View style={styles.footer}>
              <Text style={styles.footerPrompt}>{footerPrompt}</Text>
              <Pressable
                accessibilityLabel={footerActionLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onFooterAction}
                style={styles.footerAction}
              >
                <Text style={styles.footerActionText}>{footerActionLabel}</Text>
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
    backgroundColor: authColors.surface,
    borderColor: authColors.border,
    borderRadius: authRadii.card,
    borderWidth: 1,
    elevation: 2,
    marginTop: 28,
    padding: 20,
    shadowColor: '#101828',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    minHeight: 44,
    justifyContent: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  footerActionText: {
    color: authColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerPrompt: {
    color: authColors.mutedText,
    fontSize: 14,
  },
  heading: {
    alignItems: 'center',
    marginTop: 32,
  },
  keyboardAvoider: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: authColors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  subtitle: {
    color: authColors.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    color: authColors.title,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
});
