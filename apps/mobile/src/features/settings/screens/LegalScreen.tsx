import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList, MainStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { LEGAL_DOCS, type LegalBlock, type LegalSpan } from '../legalContent';

// Reachable both before sign-in (from Register) and from Settings.
type LegalScreenProps =
  | NativeStackScreenProps<AuthStackParamList, 'Legal'>
  | NativeStackScreenProps<MainStackParamList, 'Legal'>;

function Spans({ spans }: { spans: LegalSpan[] }) {
  return (
    <>
      {spans.map((span, i) =>
        span.bold ? (
          <ClayText key={i} style={styles.bold}>
            {span.text}
          </ClayText>
        ) : (
          span.text
        ),
      )}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <ClayText level={2} style={styles.h2} variant="heading">
          {block.text}
        </ClayText>
      );
    case 'h3':
      return (
        <ClayText style={styles.h3} variant="heading">
          {block.text}
        </ClayText>
      );
    case 'li':
    case 'ol':
      return (
        <View style={[styles.item, block.type === 'li' && block.depth ? styles.itemNested : null]}>
          <ClayText style={[styles.body, styles.marker]}>
            {block.type === 'ol' ? `${block.n}.` : '•'}
          </ClayText>
          <ClayText style={[styles.body, styles.itemText]}>
            <Spans spans={block.spans} />
          </ClayText>
        </View>
      );
    case 'note':
      return (
        <ClayText style={[styles.body, styles.note]}>
          <Spans spans={block.spans} />
        </ClayText>
      );
    case 'row':
      // A table row read on a phone: its first cell as the title, the others as "Header: value".
      return (
        <View style={styles.row}>
          <ClayText style={[styles.body, styles.bold]}>
            <Spans spans={block.title} />
          </ClayText>
          {block.fields.map((field) => (
            <ClayText key={field.label} style={styles.rowField}>
              <ClayText style={styles.rowLabel}>{field.label}: </ClayText>
              <Spans spans={field.spans} />
            </ClayText>
          ))}
        </View>
      );
    default:
      return (
        <ClayText style={[styles.body, styles.paragraph]}>
          <Spans spans={block.spans} />
        </ClayText>
      );
  }
}

/**
 * Privacy policy, terms of use and community guidelines, set for long Vietnamese
 * reading: 15/24 in full ink. The text is generated from docs/legal/*.md.
 */
export function LegalScreen({ navigation, route }: LegalScreenProps) {
  const document = LEGAL_DOCS[route.params.doc] ?? LEGAL_DOCS.terms;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.goBack} title={document.title} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
        {document.blocks.map((block, index) => (
          <Block block={block} key={index} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: clayColors.text,
    lineHeight: 24,
  },
  bold: {
    fontFamily: fontFamilies.semiBold,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  // A reading column: 16px margins on a phone, about 70 characters a line on wider screens.
  content: {
    alignSelf: 'center',
    maxWidth: 640 + clayDimensions.gutter * 2,
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.xl,
    width: '100%',
  },
  h2: {
    color: clayColors.text,
    marginBottom: claySpacing.sm,
    marginTop: claySpacing.xxl,
  },
  h3: {
    color: clayColors.text,
    fontSize: 15,
    marginBottom: claySpacing.xs,
    marginTop: claySpacing.lg,
  },
  item: {
    flexDirection: 'row',
    marginBottom: claySpacing.xs,
  },
  itemNested: {
    paddingLeft: claySpacing.lg,
  },
  itemText: {
    flex: 1,
  },
  marker: {
    minWidth: 22,
  },
  note: {
    backgroundColor: clayColors.surfaceWell,
    borderRadius: clayRadii.card,
    marginBottom: claySpacing.md,
    padding: claySpacing.md,
  },
  paragraph: {
    marginBottom: claySpacing.md,
  },
  // A table row: one block per row, a 2px rule on its left, fields stacked under the title.
  row: {
    borderLeftColor: clayColors.border,
    borderLeftWidth: 2,
    gap: 2,
    marginBottom: claySpacing.md,
    paddingLeft: claySpacing.md,
  },
  rowField: {
    color: clayColors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  rowLabel: {
    color: clayColors.caption,
    fontSize: 14,
  },
});
