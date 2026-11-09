import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, clayRadii, claySpacing } from '../../../theme/spacing';
import { PostCard } from '../../feed/components/PostCard';
import { SENSITIVE_BLUR_RADIUS, SensitiveCover } from '../../feed/components/SensitiveCover';
import { MOCK_POSTS } from '../../feed/mockData';
import { ReelOverlay } from '../../reel/components/ReelOverlay';

export type IntroPictureKind = 'post' | 'reel' | 'safety';

// The pictures are the app's own screens with its mock content, not drawings.
const [, PHOTO_POST, MULTI_PHOTO_POST] = MOCK_POSTS;
const REEL_POST = { ...MULTI_PHOTO_POST, media: [MULTI_PHOTO_POST.media[1]] };
const SCAM_TEXT = 'Bạn chuyển trước 500k để giữ chỗ nhé, rồi gửi mình mã OTP ngân hàng để xác nhận.';
/** Below this the reel's action column no longer fits: the frame is cropped from the top instead. */
const REEL_MIN_HEIGHT = 460;
/** Smaller than this and the chat text is no longer readable. */
const MIN_CHAT_SCALE = 0.6;
const noop = () => undefined;

function Fragment({ kind }: { kind: IntroPictureKind }) {
  if (kind === 'post') {
    return <PostCard post={PHOTO_POST} />;
  }

  if (kind === 'reel') {
    return (
      <View style={styles.reel}>
        <Image contentFit="cover" source={{ uri: REEL_POST.media[0].url }} style={StyleSheet.absoluteFill} />
        <ReelOverlay
          bottomInset={0}
          canFollow
          isMuted
          onFollow={noop}
          onOpenComments={noop}
          onOpenMenu={noop}
          onPressAuthor={noop}
          onPressHashtag={noop}
          onPressMention={noop}
          onShare={noop}
          onToggleLike={noop}
          onToggleMute={noop}
          onToggleSave={noop}
          post={REEL_POST}
        />
      </View>
    );
  }

  // A conversation from a stranger, as ChatScreen draws it: blurred image, scam warning.
  return (
    <View style={styles.chat}>
      <View style={styles.chatImage}>
        <Image
          blurRadius={SENSITIVE_BLUR_RADIUS}
          contentFit="cover"
          source={{ uri: MULTI_PHOTO_POST.media[0].url }}
          style={StyleSheet.absoluteFill}
        />
        <SensitiveCover onReveal={noop} />
      </View>
      <View style={styles.bubble}>
        <ClayText variant="body">{SCAM_TEXT}</ClayText>
      </View>
      <View style={styles.warning}>
        <ClayIcon color={clayColors.warningInk} name="TriangleWarning" size={16} />
        <ClayText style={styles.warningText} variant="caption">
          Tin nhắn có dấu hiệu lừa đảo. Đừng chuyển tiền hay gửi mã OTP.
        </ClayText>
      </View>
    </View>
  );
}

/**
 * A non-interactive fragment of the real interface for an intro slide, laid
 * out at phone width and shrunk to the frame's width. On a short screen the
 * post is cut at the bottom and the reel at the top (its controls sit low);
 * the chat shrinks further (not below MIN_CHAT_SCALE) so both safety marks stay in view.
 */
export function IntroPicture({ kind }: { kind: IntroPictureKind }) {
  const { width: windowWidth } = useWindowDimensions();
  const [area, setArea] = useState<{ height: number; width: number } | null>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // The frame's 1px border takes 2px of each dimension.
  const widthScale = area ? (area.width - 2) / windowWidth : 1;
  const scale =
    kind === 'safety' && area && naturalHeight
      ? Math.max(MIN_CHAT_SCALE * widthScale, Math.min(widthScale, (area.height - 2) / naturalHeight))
      : widthScale;
  const fillHeight =
    kind === 'reel' && area ? Math.max(REEL_MIN_HEIGHT, (area.height - 2) / scale) : undefined;
  const frameHeight = area ? Math.min(area.height, (fillHeight ?? naturalHeight) * scale + 2) : 0;
  const fromTop = kind === 'post';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setArea(event.nativeEvent.layout)}
      pointerEvents="none"
      style={styles.area}
    >
      {area ? (
        <View style={[styles.frame, { height: frameHeight, width: windowWidth * scale + 2 }]}>
          <View
            onLayout={(event) => setNaturalHeight(event.nativeEvent.layout.height)}
            style={[
              styles.content,
              fromTop ? styles.top : styles.bottom,
              {
                height: fillHeight,
                transform: [{ scale }],
                transformOrigin: fromTop ? 'left top' : 'left bottom',
                width: windowWidth,
              },
            ]}
          >
            <Fragment kind={kind} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: claySpacing.xl,
  },
  bottom: {
    bottom: 0,
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: clayColors.surface,
    borderBottomLeftRadius: 4,
    borderColor: clayColors.border,
    borderRadius: clayRadii.dialog,
    borderWidth: 1,
    marginTop: claySpacing.xs,
    maxWidth: '78%',
    paddingHorizontal: claySpacing.md,
    paddingVertical: claySpacing.sm,
  },
  chat: {
    backgroundColor: clayColors.canvas,
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.base,
  },
  chatImage: {
    borderRadius: clayRadii.media,
    height: 100,
    overflow: 'hidden',
    width: 240,
  },
  content: {
    left: 0,
    position: 'absolute',
  },
  frame: {
    backgroundColor: clayColors.surface,
    borderColor: clayColors.border,
    borderRadius: clayRadii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reel: {
    backgroundColor: '#000000',
    flex: 1,
  },
  top: {
    top: 0,
  },
  // The scam warning, as ChatScreen attaches it to the message it is about.
  warning: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    backgroundColor: clayColors.warningBg,
    borderColor: clayColors.warningBorder,
    borderRadius: clayRadii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: claySpacing.sm,
    marginTop: claySpacing.xs,
    maxWidth: '78%',
    paddingHorizontal: claySpacing.md,
    paddingVertical: claySpacing.sm,
  },
  warningText: {
    color: clayColors.warningInk,
    flexShrink: 1,
  },
});
