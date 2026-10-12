import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { showToast } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { UserRow } from '../../../components/common/UserRow';
import { ClayEmoji } from '../../../components/icons/ClayEmoji';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
import { followApi } from '../../../services/followApi';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import { profileService } from '../../profile/services/profileService';
import { suggestionReason } from '../../profile/suggestionReason';
import type { SuggestedUser, UpdateProfilePayload } from '../../profile/types';
import { accountService } from '../../settings/accountService';

const STEP_COUNT = 3;
const USERNAME_PATTERN = /^[a-zA-Z0-9._]{3,30}$/;

/**
 * First-run setup after the first sign-in: profile picture and names, a short
 * bio, then people to follow. Every step can be skipped; finishing (or
 * skipping to the end) marks the account as onboarded on the server so the
 * setup is not shown again on any device.
 */
export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { updateUser, user } = useAuthSession();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState<UpdateProfilePayload['avatar']>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedUser[] | null>(null);
  const [isFollowingAll, setIsFollowingAll] = useState(false);

  const isSuggestionStep = step === STEP_COUNT - 1;

  useEffect(() => {
    if (isSuggestionStep && suggestions === null) {
      profileService
        .getSuggestions(15)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }
  }, [isSuggestionStep, suggestions]);

  const finish = useCallback(async () => {
    setIsSaving(true);

    try {
      await accountService.completeOnboarding();
    } catch {
      // Still let the user in; the setup will simply be offered again next time.
    }

    // Leaving `null` is what moves the root navigator on to the main app.
    updateUser?.({ onboardedAt: new Date().toISOString() });
  }, [updateUser]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      setAvatar({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  };

  /** Saves what the current step changed, then moves on. */
  const handleNext = async () => {
    if (!user) {
      return;
    }

    setError(null);

    const trimmedName = displayName.trim();
    const trimmedUsername = username.trim();
    const changes: UpdateProfilePayload =
      step === 0
        ? {
            ...(avatar ? { avatar } : {}),
            ...(trimmedName && trimmedName !== user.displayName ? { displayName: trimmedName } : {}),
            ...(trimmedUsername !== user.username ? { username: trimmedUsername } : {}),
          }
        : bio.trim() !== (user.bio ?? '')
          ? { bio: bio.trim() }
          : {};

    if (step === 0 && !USERNAME_PATTERN.test(trimmedUsername)) {
      setError('Tên người dùng dài 3–30 ký tự, chỉ gồm chữ, số, dấu chấm và gạch dưới.');
      return;
    }

    if (Object.keys(changes).length > 0) {
      setIsSaving(true);

      try {
        const updated = await profileService.updateProfile(user, changes);

        // `onboardedAt` stays null here, so the setup keeps showing.
        updateUser?.({
          avatarUrl: updated.avatarUrl,
          bio: updated.bio,
          displayName: updated.displayName,
          username: updated.username,
        });
        setAvatar(undefined);
      } catch (saveError) {
        setError(
          saveError instanceof ApiError && saveError.status === 409
            ? 'Tên người dùng này đã có người dùng. Hãy chọn tên khác.'
            : 'Không lưu được. Kiểm tra kết nối rồi thử lại.',
        );
        return;
      } finally {
        setIsSaving(false);
      }
    }

    setStep(step + 1);
  };

  const handleFollowAll = async () => {
    if (!suggestions) {
      return;
    }

    setIsFollowingAll(true);
    // `followApi` publishes each follow, which flips the buttons in the rows.
    await Promise.allSettled(suggestions.map((item) => followApi.follow(item.id)));
    setIsFollowingAll(false);
  };

  const previewUrl = avatar ? avatar.uri : (user?.avatarUrl ?? null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 12 }]}
    >
      {/* ── Progress + skip ───────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.progress}>
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <View key={index} style={[styles.progressDot, index <= step && styles.progressDotDone]} />
          ))}
        </View>
        <Pressable
          accessibilityLabel="Bỏ qua phần thiết lập"
          accessibilityRole="button"
          disabled={isSaving}
          hitSlop={8}
          onPress={finish}
          style={styles.skip}
        >
          <ClayText style={styles.skipText} variant="caption">
            Bỏ qua
          </ClayText>
        </Pressable>
      </View>

      {step === 0 ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <ClayText style={styles.title} variant="title">
            Chào mừng bạn!
          </ClayText>
          <ClayText style={styles.subtitle} variant="body">
            Thêm ảnh và tên để bạn bè nhận ra bạn.
          </ClayText>

          <Pressable
            accessibilityLabel="Chọn ảnh đại diện"
            accessibilityRole="button"
            onPress={pickAvatar}
            style={styles.avatarPicker}
          >
            <UserAvatar avatarUrl={previewUrl} name={displayName.trim() || username || '?'} size={104} />
            <ClayText style={styles.link} variant="caption">
              {previewUrl ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
            </ClayText>
          </Pressable>

          <ClayText style={styles.label} variant="meta">
            Tên hiển thị
          </ClayText>
          <ClaySurface style={styles.inputSurface} variant="inset">
            <TextInput
              accessibilityLabel="Tên hiển thị"
              maxLength={50}
              onChangeText={setDisplayName}
              placeholder="Tên của bạn"
              placeholderTextColor={clayColors.caption}
              style={styles.input}
              value={displayName}
            />
          </ClaySurface>

          <ClayText style={styles.label} variant="meta">
            Tên người dùng
          </ClayText>
          <ClaySurface style={styles.inputSurface} variant="inset">
            <TextInput
              accessibilityLabel="Tên người dùng"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              onChangeText={setUsername}
              placeholder="ten.nguoi.dung"
              placeholderTextColor={clayColors.caption}
              style={styles.input}
              value={username}
            />
          </ClaySurface>
        </ScrollView>
      ) : step === 1 ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <ClayEmoji name="memo" size={72} />
          <ClayText style={styles.title} variant="title">
            Giới thiệu đôi chút
          </ClayText>
          <ClayText style={styles.subtitle} variant="body">
            Một hai câu về bạn sẽ hiện trên trang cá nhân.
          </ClayText>
          <ClaySurface style={[styles.inputSurface, styles.bioSurface]} variant="inset">
            <TextInput
              accessibilityLabel="Tiểu sử"
              maxLength={160}
              multiline
              onChangeText={setBio}
              placeholder="Bạn thích gì, đang làm gì..."
              placeholderTextColor={clayColors.caption}
              style={[styles.input, styles.bioInput]}
              textAlignVertical="top"
              value={bio}
            />
          </ClaySurface>
          <ClayText style={styles.counter} variant="meta">
            {bio.length}/160
          </ClayText>
        </ScrollView>
      ) : (
        <View style={styles.suggestions}>
          <View style={styles.suggestionsHeader}>
            <ClayText style={styles.title} variant="title">
              Những người bạn có thể quen
            </ClayText>
            <ClayText style={styles.subtitle} variant="body">
              Theo dõi vài người để bảng tin có nội dung ngay.
            </ClayText>
          </View>
          {suggestions === null ? (
            <ActivityIndicator color={clayColors.primary} size="large" style={styles.flex} />
          ) : (
            <FlatList
              data={suggestions}
              initialNumToRender={10}
              windowSize={7}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <ClayText style={styles.empty} variant="body">
                  Chưa có gợi ý nào. Bạn có thể tìm bạn bè ở tab Tìm kiếm.
                </ClayText>
              }
              renderItem={({ item }) => <UserRow subtitle={suggestionReason(item)} user={item} />}
              style={styles.flex}
            />
          )}
          {suggestions && suggestions.length > 1 ? (
            <ClayButton
              accessibilityLabel="Theo dõi tất cả người được gợi ý"
              disabled={isFollowingAll}
              loading={isFollowingAll}
              onPress={handleFollowAll}
              style={styles.followAll}
              title="Theo dõi tất cả"
              variant="secondary"
            />
          ) : null}
        </View>
      )}

      {error ? (
        <ClayText accessibilityLiveRegion="polite" style={styles.error} variant="caption">
          {error}
        </ClayText>
      ) : null}

      <ClayButton
        accessibilityLabel={isSuggestionStep ? 'Hoàn tất thiết lập' : 'Sang bước tiếp theo'}
        disabled={isSaving}
        loading={isSaving}
        onPress={isSuggestionStep ? finish : handleNext}
        style={styles.next}
        title={isSuggestionStep ? 'Vào bảng tin' : 'Tiếp tục'}
        variant="primary"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatarPicker: {
    alignItems: 'center',
    gap: claySpacing.sm,
    marginBottom: claySpacing.lg,
    marginTop: claySpacing.xl,
    minHeight: clayDimensions.minTouchTarget,
  },
  bioInput: {
    minHeight: 96,
  },
  bioSurface: {
    alignSelf: 'stretch',
    marginTop: claySpacing.xl,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: claySpacing.xl,
    paddingTop: claySpacing.xl,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  counter: {
    alignSelf: 'flex-end',
    color: clayColors.caption,
    marginTop: claySpacing.xs,
  },
  empty: {
    color: clayColors.caption,
    padding: claySpacing.xxl,
    textAlign: 'center',
  },
  error: {
    color: clayColors.error,
    marginBottom: claySpacing.sm,
    paddingHorizontal: claySpacing.xl,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  followAll: {
    marginBottom: claySpacing.md,
    marginHorizontal: claySpacing.xl,
  },
  input: {
    color: clayColors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: claySpacing.md,
  },
  inputSurface: {
    alignSelf: 'stretch',
  },
  label: {
    alignSelf: 'flex-start',
    color: clayColors.textSecondary,
    marginBottom: claySpacing.xs,
    marginTop: claySpacing.md,
  },
  link: {
    color: clayColors.primary,
  },
  next: {
    marginHorizontal: claySpacing.xl,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    backgroundColor: clayColors.border,
    borderRadius: 3,
    height: 6,
    width: 28,
  },
  progressDotDone: {
    backgroundColor: clayColors.primary,
  },
  skip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  skipText: {
    color: clayColors.textSecondary,
  },
  subtitle: {
    color: clayColors.textSecondary,
    marginTop: claySpacing.xs,
    textAlign: 'center',
  },
  suggestions: {
    flex: 1,
  },
  suggestionsHeader: {
    alignItems: 'center',
    paddingBottom: claySpacing.md,
    paddingHorizontal: claySpacing.xl,
    paddingTop: claySpacing.xl,
  },
  title: {
    color: clayColors.text,
    textAlign: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: claySpacing.lg,
  },
});
