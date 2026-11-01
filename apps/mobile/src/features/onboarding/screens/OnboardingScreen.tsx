import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { showToast } from '../../../components/common/toast';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { UserRow } from '../../../components/common/UserRow';
import { ClayButton } from '../../../components/ui/ClayButton';
import { ClayInput } from '../../../components/ui/ClayInput';
import { ClayText } from '../../../components/ui/ClayText';
import { ApiError } from '../../../services/apiError';
import { followApi } from '../../../services/followApi';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { tabularNums } from '../../../theme/typography';
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
  const [suggestionsFailed, setSuggestionsFailed] = useState(false);

  const isSuggestionStep = step === STEP_COUNT - 1;

  useEffect(() => {
    if (isSuggestionStep && suggestions === null && !suggestionsFailed) {
      profileService
        .getSuggestions(15)
        .then(setSuggestions)
        .catch(() => setSuggestionsFailed(true));
    }
  }, [isSuggestionStep, suggestions, suggestionsFailed]);

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
      style={[styles.container, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 8 }]}
    >
      {/* Step track and skip */}
      <View style={styles.topBar}>
        <View style={styles.progress}>
          <ClayText style={tabularNums} variant="caption">
            Bước {step + 1}/{STEP_COUNT}
          </ClayText>
          <View style={styles.progressTrack}>
            {Array.from({ length: STEP_COUNT }, (_, index) => (
              <View key={index} style={[styles.progressStep, index <= step && styles.progressStepDone]} />
            ))}
          </View>
        </View>
        <Pressable
          accessibilityLabel="Bỏ qua phần thiết lập"
          accessibilityRole="button"
          disabled={isSaving}
          hitSlop={8}
          onPress={finish}
          style={styles.skip}
        >
          <ClayText style={styles.skipText} variant="button">
            Bỏ qua
          </ClayText>
        </Pressable>
      </View>

      {step === 0 ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <ClayText level={1} variant="title">
            Hồ sơ của bạn
          </ClayText>
          <ClayText style={styles.subtitle} variant="body">
            Thêm ảnh và tên để bạn bè nhận ra bạn.
          </ClayText>

          <View style={styles.avatarRow}>
            <UserAvatar avatarUrl={previewUrl} name={displayName.trim() || username || '?'} size={72} />
            <ClayButton
              accessibilityLabel="Chọn ảnh đại diện"
              onPress={pickAvatar}
              size="sm"
              title={previewUrl ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
              variant="secondary"
            />
          </View>

          <ClayInput
            accessibilityLabel="Tên hiển thị"
            label="Tên hiển thị"
            maxLength={50}
            onChangeText={setDisplayName}
            placeholder="vd. Minh Anh"
            value={displayName}
          />
          <ClayInput
            accessibilityLabel="Tên người dùng"
            autoCapitalize="none"
            autoCorrect={false}
            label="Tên người dùng"
            maxLength={30}
            onChangeText={setUsername}
            placeholder="vd. minh.anh"
            value={username}
          />
        </ScrollView>
      ) : step === 1 ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <ClayText level={1} variant="title">
            Giới thiệu bản thân
          </ClayText>
          <ClayText style={styles.subtitle} variant="body">
            Một hai câu về bạn, hiện dưới tên trên trang cá nhân.
          </ClayText>
          <ClayInput
            accessibilityLabel="Tiểu sử"
            containerStyle={styles.bioField}
            label="Tiểu sử"
            maxLength={160}
            multiline
            onChangeText={setBio}
            placeholder="Bạn thích gì, đang làm gì"
            style={styles.bioInput}
            textAlignVertical="top"
            value={bio}
          />
          <ClayText style={[styles.counter, tabularNums]} variant="meta">
            {bio.length}/160
          </ClayText>
        </ScrollView>
      ) : (
        <View style={styles.suggestions}>
          <View style={styles.suggestionsHeader}>
            <ClayText level={1} variant="title">
              Gợi ý theo dõi
            </ClayText>
            <ClayText style={styles.subtitle} variant="body">
              Theo dõi vài người để bảng tin có nội dung ngay.
            </ClayText>
          </View>
          {suggestionsFailed ? (
            <View style={styles.blockMessage}>
              <ClayText style={styles.secondaryText} variant="body">
                Không tải được gợi ý. Kiểm tra kết nối rồi thử lại.
              </ClayText>
              <ClayButton
                accessibilityLabel="Tải lại gợi ý"
                onPress={() => {
                  setSuggestions(null);
                  setSuggestionsFailed(false);
                }}
                size="sm"
                style={styles.retry}
                title="Thử lại"
                variant="secondary"
              />
            </View>
          ) : suggestions === null ? (
            <ActivityIndicator color={clayColors.caption} style={styles.blockMessage} />
          ) : (
            <FlatList
              data={suggestions}
              initialNumToRender={10}
              windowSize={7}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <ClayText style={[styles.blockMessage, styles.secondaryText]} variant="body">
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
              title={`Theo dõi cả ${suggestions.length} người`}
              variant="tonal"
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
        size="lg"
        style={styles.next}
        title={isSuggestionStep ? 'Vào bảng tin' : 'Tiếp tục'}
        variant="primary"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.base,
    marginBottom: claySpacing.xl,
  },
  bioField: {
    marginBottom: claySpacing.xs,
  },
  bioInput: {
    minHeight: 96,
    paddingTop: claySpacing.md,
  },
  blockMessage: {
    paddingHorizontal: clayDimensions.gutter,
    paddingVertical: claySpacing.xl,
  },
  body: {
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.xl,
  },
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  error: {
    color: clayColors.error,
    marginBottom: claySpacing.sm,
    paddingHorizontal: clayDimensions.gutter,
  },
  flex: {
    flex: 1,
  },
  followAll: {
    marginBottom: claySpacing.md,
    marginHorizontal: clayDimensions.gutter,
  },
  next: {
    marginHorizontal: clayDimensions.gutter,
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
  },
  progressStep: {
    backgroundColor: clayColors.primaryTrack,
    borderRadius: 2,
    height: 4,
    width: 24,
  },
  progressStepDone: {
    backgroundColor: clayColors.primary,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: claySpacing.xs,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: claySpacing.md,
  },
  secondaryText: {
    color: clayColors.textSecondary,
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
  subtitle: {
    color: clayColors.textSecondary,
    marginBottom: claySpacing.xl,
    marginTop: claySpacing.sm,
  },
  suggestions: {
    flex: 1,
  },
  suggestionsHeader: {
    paddingHorizontal: clayDimensions.gutter,
    paddingTop: claySpacing.xl,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: clayDimensions.minTouchTarget,
    paddingHorizontal: clayDimensions.gutter,
  },
});
