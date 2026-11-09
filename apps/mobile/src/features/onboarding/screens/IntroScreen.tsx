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

import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { AuthBrand } from '../../auth/components/AuthBrand';
import { IntroPicture } from '../components/IntroPicture';
import { introStorage } from '../introStorage';

type IntroScreenProps = NativeStackScreenProps<AuthStackParamList, 'Intro'>;

// Each slide names real features: the safety marks are the product's own, so they get the last word.
const SLIDES = [
  {
    body: 'Đăng ảnh và video, chọn ai được xem từng bài viết.',
    picture: 'post',
    points: [
      { icon: 'Camera', text: 'Bài viết ảnh và video' },
      { icon: 'GlobeSimple', text: 'Công khai, bạn bè hoặc chỉ mình tôi' },
      { icon: 'Heart', text: 'Bình luận và thả cảm xúc' },
    ],
    title: 'Chia sẻ khoảnh khắc',
  },
  {
    body: 'Lướt video ngắn toàn màn hình, đăng tin tự ẩn sau 24 giờ.',
    picture: 'reel',
    points: [
      { icon: 'VideoCamera', text: 'Reels xem toàn màn hình' },
      { icon: 'Sparkle', text: 'Tin tự ẩn sau 24 giờ' },
      { icon: 'Reply', text: 'Trả lời tin bằng tin nhắn' },
    ],
    title: 'Reels và tin 24 giờ',
  },
  {
    body: 'Mobile Social dành cho người từ 18 tuổi, với các lớp bảo vệ bật sẵn khi nhắn tin.',
    picture: 'safety',
    points: [
      { icon: 'Inbox', text: 'Tin nhắn từ người lạ vào mục Tin nhắn chờ' },
      { icon: 'EyeSlash', text: 'Ảnh nhạy cảm được làm mờ, chạm để xem' },
      { icon: 'TriangleWarning', text: 'Cảnh báo tin nhắn có dấu hiệu lừa đảo' },
    ],
    title: 'Nhắn tin an toàn',
  },
] as const;

/** Product introduction shown once, the first time the app is opened. */
export function IntroScreen({ navigation }: IntroScreenProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width } = useWindowDimensions();
  // Small phones (about 640 tall): tighter list rows leave the picture room. The rows are not buttons.
  const compact = windowHeight < 700;
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);
  // A horizontal list sizes its cells to their content: the slide takes the list's height so its copy can sit low.
  const [listHeight, setListHeight] = useState<number>();
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <AuthBrand />
        <Pressable
          accessibilityLabel="Bỏ qua phần giới thiệu"
          accessibilityRole="button"
          hitSlop={8}
          onPress={finish}
          style={styles.skip}
        >
          <ClayText style={styles.skipText} variant="button">
            Bỏ qua
          </ClayText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        keyExtractor={(item) => item.title}
        onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        renderItem={({ item, index: slideIndex }) => (
          <View style={[styles.slide, { height: listHeight, width }]}>
            {/* Fills the space above the copy with a real piece of the app. */}
            <IntroPicture kind={item.picture} />
            {/* Every slide stays mounted: only the one in view is the screen's h1. */}
            <ClayText level={slideIndex === index ? 1 : 2} variant="title">
              {item.title}
            </ClayText>
            <ClayText style={styles.body} variant="body">
              {item.body}
            </ClayText>
            <View style={[styles.points, compact && styles.pointsCompact]}>
              {item.points.map((point) => (
                <View key={point.text} style={[styles.point, compact && styles.pointCompact]}>
                  <ClayIcon color={clayColors.textSecondary} name={point.icon} size={20} />
                  <ClayText style={styles.pointText} variant="body">
                    {point.text}
                  </ClayText>
                </View>
              ))}
            </View>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View
        accessibilityLabel={`Trang ${index + 1} trên ${SLIDES.length}`}
        style={styles.dots}
      >
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
        size="lg"
        style={styles.next}
        title={isLast ? 'Bắt đầu' : 'Tiếp tục'}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.sm,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  dot: {
    backgroundColor: clayColors.primaryTrack,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: clayColors.primary,
    width: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: claySpacing.xl,
    paddingHorizontal: clayDimensions.gutter,
  },
  next: {
    marginHorizontal: clayDimensions.gutter,
  },
  point: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: clayDimensions.minTouchTarget,
  },
  pointText: {
    flex: 1,
  },
  pointCompact: {
    minHeight: 32,
  },
  pointsCompact: {
    marginTop: claySpacing.base,
    paddingTop: claySpacing.sm,
  },
  points: {
    borderTopColor: clayColors.rule,
    borderTopWidth: 1,
    gap: claySpacing.xs,
    marginTop: claySpacing.xl,
    paddingTop: claySpacing.base,
  },
  skip: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -claySpacing.sm,
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.sm,
  },
  skipText: {
    color: clayColors.textSecondary,
  },
  // Copy sits low, beside the button that moves it on; the picture takes the space above.
  slide: {
    justifyContent: 'flex-end',
    paddingBottom: claySpacing.xl,
    paddingTop: claySpacing.base,
    paddingHorizontal: clayDimensions.gutter,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: clayDimensions.gutter,
  },
});
