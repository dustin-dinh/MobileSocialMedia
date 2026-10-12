import { memo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { clayColors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { ClayText, type ClayTextVariant } from '../ui/ClayText';

type RichTextProps = {
  numberOfLines?: number;
  onPressHashtag?: (tag: string) => void;
  onPressMention?: (username: string) => void;
  /** Tap on the plain part of the text. */
  onPressText?: () => void;
  style?: StyleProp<TextStyle>;
  text: string;
  /** Overrides the hashtag / mention colour, e.g. on top of a video. */
  tokenStyle?: StyleProp<TextStyle>;
  variant?: ClayTextVariant;
};

// Letters include the Vietnamese range so hashtags like #đồăn work. Written
// with explicit ranges because not every JS engine supports \p{L}.
const TOKEN_PATTERN = /([#@][\w.\u00C0-\u1EF9]*[\w\u00C0-\u1EF9])/g;

/** Post or comment text with tappable `#hashtag` and `@username` tokens. */
export const RichText = memo(function RichText({
  numberOfLines,
  onPressHashtag,
  onPressMention,
  onPressText,
  style,
  text,
  tokenStyle,
  variant = 'body',
}: RichTextProps) {
  const parts = text.split(TOKEN_PATTERN);

  return (
    <ClayText numberOfLines={numberOfLines} onPress={onPressText} style={style} variant={variant}>
      {parts.map((part, index) => {
        // `split` with one capture group puts the tokens at the odd indexes.
        if (index % 2 === 0) {
          return part;
        }

        const isHashtag = part.startsWith('#');
        const handler = isHashtag ? onPressHashtag : onPressMention;

        return (
          <ClayText
            key={`${index}-${part}`}
            onPress={handler ? () => handler(part.slice(1)) : undefined}
            style={[styles.token, tokenStyle]}
            variant={variant}
          >
            {part}
          </ClayText>
        );
      })}
    </ClayText>
  );
});

const styles = StyleSheet.create({
  token: {
    color: clayColors.primary,
    fontFamily: fontFamilies.semiBold,
  },
});
