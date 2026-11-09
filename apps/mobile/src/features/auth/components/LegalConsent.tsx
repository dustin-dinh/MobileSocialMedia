import { Pressable, StyleSheet, View } from 'react-native';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';

export type LegalDoc = 'community' | 'privacy' | 'terms';

type LegalConsentProps = {
  /** A required checkbox; leave out for the plain sentence (above the Google button). */
  checked?: boolean;
  /** Start of the sentence, before the three document links. */
  lead?: string;
  onChange?: (checked: boolean) => void;
  onOpenDoc: (doc: LegalDoc) => void;
};

const CONSENT_SENTENCE =
  'Tôi đồng ý với Điều khoản sử dụng, Chính sách quyền riêng tư và Tiêu chuẩn cộng đồng';

/** Consent to the terms, privacy policy and community guidelines, each a link to its text. */
export function LegalConsent({ checked, lead = 'Tôi đồng ý với', onChange, onOpenDoc }: LegalConsentProps) {
  const link = (doc: LegalDoc, label: string) => (
    <ClayText accessibilityRole="link" onPress={() => onOpenDoc(doc)} style={styles.link} variant="caption">
      {label}
    </ClayText>
  );
  const sentence = (
    <>
      {lead} {link('terms', 'Điều khoản sử dụng')}, {link('privacy', 'Chính sách quyền riêng tư')} và{' '}
      {link('community', 'Tiêu chuẩn cộng đồng')}.
    </>
  );

  if (checked === undefined) {
    return (
      <ClayText style={styles.sentence} variant="caption">
        {sentence}
      </ClayText>
    );
  }

  const toggle = () => onChange?.(!checked);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={CONSENT_SENTENCE}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        hitSlop={4}
        onPress={toggle}
        style={styles.boxTarget}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked ? <ClayIcon color={clayColors.onPrimary} name="Check" size={14} /> : null}
        </View>
      </Pressable>
      <ClayText onPress={toggle} style={[styles.sentence, styles.rowText]} variant="caption">
        {sentence}
      </ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    backgroundColor: clayColors.surface,
    borderColor: clayColors.control,
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  // Ink, not the brand hue: the screen's one brand mark is its primary button.
  boxChecked: {
    backgroundColor: clayColors.text,
    borderColor: clayColors.text,
  },
  boxTarget: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    marginLeft: -12,
    width: clayDimensions.minTouchTarget,
  },
  link: {
    color: clayColors.primaryInk,
    fontFamily: fontFamilies.semiBold,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: claySpacing.base,
  },
  rowText: {
    flex: 1,
    marginBottom: 0,
    paddingTop: 12,
  },
  sentence: {
    color: clayColors.textSecondary,
    marginBottom: claySpacing.base,
  },
});
