import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { introStorage } from '../introStorage';

type IntroScreenProps = NativeStackScreenProps<AuthStackParamList, 'Intro'>;

const SLIDES = [
  {
    body: 'Đăng ảnh và suy nghĩ của bạn, chọn ai được xem từng bài viết.',
    emoji: 'camera',
    title: 'Chia sẻ khoảnh khắc',
  },
  {
    body: 'Theo dõi bạn bè, thích, bình luận và đăng lại những bài viết bạn yêu thích.',
    emoji: 'speech_balloon',
    title: 'Kết nối với mọi người',
  },
  {
    body: 'Nhận thông báo ngay khi có người tương tác, và khám phá những người bạn có thể quen.',
    emoji: 'bell',
    title: 'Không bỏ lỡ điều gì',
  },
] as const;

/** Product introduction shown once, the first time the app is opened. */
export function IntroScreen({ navigation }: IntroScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    void introStorage.markSeen();
    navigation.replace('Login');
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }

    listRef.current?.scrollToOffset({ animated: true, offset: (index + 1) * width });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Bỏ qua phần giới thiệu"
          accessibilityRole="button"
          hitSlop={8}
          onPress={finish}
          style={styles.skip}
        >
          <ClayText style={styles.skipText} variant="caption">
            Bỏ qua
          </ClayText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        keyExtractor={(item) => item.title}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <ClaySurface style={styles.art} variant="raised">
              <ClayEmoji name={item.emoji} size={96} />
            </ClaySurface>
            <ClayText style={styles.title} variant="title">
              {item.title}
            </ClayText>
            <ClayText style={styles.body} variant="body">
              {item.body}
            </ClayText>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, slideIndex) => (
          <View
            key={slide.title}
            style={[styles.dot, slideIndex === index && styles.dotActive]}
          />
        ))}
      </View>

      <ClayButton
        accessibilityLabel={isLast ? 'Bắt đầu sử dụng' : 'Xem trang tiếp theo'}
        onPress={handleNext}
        style={styles.next}
        title={isLast ? 'Bắt đầu' : 'Tiếp tục'}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
    width: 180,
  },
  body: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.md,
    textAlign: 'center',
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  dot: {
    backgroundColor: clayColors.border,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: clayColors.primary,
    width: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: claySpacing.xl,
  },
  next: {
    marginHorizontal: claySpacing.xl,
  },
  skip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.base,
  },
  skipText: {
    color: clayColors.textSecondary,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: claySpacing.xxl,
  },
  title: {
    color: clayColors.text,
    marginTop: claySpacing.xxl,
    textAlign: 'center',
  },
  topBar: {
    alignItems: 'flex-end',
  },
});
