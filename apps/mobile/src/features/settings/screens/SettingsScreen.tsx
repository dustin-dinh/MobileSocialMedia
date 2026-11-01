import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import appConfig from '../../../../app.json';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';
import { useAuthSession } from '../../auth/authSession';
import { profileService } from '../../profile/services/profileService';

type Row = {
  destructive?: boolean;
  /** One grey line under the label: what the setting does or what happens. */
  description?: string;
  icon: string;
  key: string;
  label: string;
  onPress: () => void;
  /** An on/off switch instead of a chevron. */
  toggle?: boolean;
  /** Current value, right-aligned before the chevron (or alone on read-only rows). */
  value?: string;
  /** No chevron and no press: the row only shows a value. */
  readOnly?: boolean;
};

function SettingsGroup({ rows, title }: { rows: Row[]; title?: string }) {
  return (
    <View style={styles.group}>
      {title ? (
        <ClayText level={2} style={styles.groupTitle} variant="caption">
          {title}
        </ClayText>
      ) : null}
      <View style={styles.groupRows}>
        {rows.map((row, index) => {
          const color = row.destructive ? clayColors.error : clayColors.text;

          return (
            <Pressable
              accessibilityHint={row.description}
              accessibilityLabel={row.value ? `${row.label}: ${row.value}` : row.label}
              accessibilityRole={row.toggle === undefined ? 'button' : 'switch'}
              accessibilityState={row.toggle === undefined ? undefined : { checked: row.toggle }}
              disabled={row.readOnly}
              key={row.key}
              onPress={row.onPress}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.rowIcon}>
                <ClayIcon
                  color={row.destructive ? clayColors.error : clayColors.caption}
                  name={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.rowText}>
                <ClayText style={[styles.rowLabel, { color }]} variant="body">
                  {row.label}
                </ClayText>
                {row.description ? (
                  <ClayText style={styles.rowDescription} variant="caption">
                    {row.description}
                  </ClayText>
                ) : null}
              </View>
              {row.value !== undefined ? (
                <ClayText numberOfLines={1} style={styles.rowValue} variant="caption">
                  {row.value}
                </ClayText>
              ) : null}
              {row.toggle !== undefined ? (
                <Switch
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  onValueChange={row.onPress}
                  thumbColor={clayColors.surfaceHigh}
                  // Toggles use the positive green, never the brand hue.
                  trackColor={{ false: clayColors.control, true: clayColors.success }}
                  value={row.toggle}
                />
              ) : row.readOnly ? null : (
                <ClayIcon color={clayColors.caption} name="CaretRight" size={16} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Account settings: profile, password, blocked users, legal pages, sign out, delete account. */
export function SettingsScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { signOut, updateUser, user } = useAuthSession();
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // The switch moves at once; a failed save moves it back.
  const handleTogglePrivate = async () => {
    const next = !user?.isPrivate;

    updateUser?.({ isPrivate: next });

    try {
      await profileService.setPrivate(next);
      showToast(
        next
          ? 'Tài khoản đã chuyển sang riêng tư.'
          : 'Tài khoản đã công khai. Các yêu cầu đang chờ được chấp nhận.',
      );
    } catch {
      updateUser?.({ isPrivate: !next });
      showToast('Không lưu được thay đổi. Vui lòng thử lại.', 'error');
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      // On success the root navigator swaps to the auth screens by itself.
      await signOut();
    } catch {
      setIsSigningOut(false);
      setIsSignOutVisible(false);
      showToast('Không đăng xuất được. Kiểm tra kết nối rồi thử lại.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={navigation.back} title="Cài đặt" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
        <SettingsGroup
          rows={[
            {
              icon: 'User',
              key: 'email',
              label: 'Email',
              onPress: () => undefined,
              readOnly: true,
              value: user?.email ?? '',
            },
            {
              icon: 'LockKey',
              key: 'password',
              label: user?.hasPassword === false ? 'Đặt mật khẩu' : 'Đổi mật khẩu',
              onPress: () => navigation.open('ChangePassword'),
            },
            {
              icon: 'BookmarkSimple',
              key: 'saved',
              label: 'Bài viết đã lưu',
              onPress: () => navigation.open('SavedPosts'),
            },
          ]}
          title="Tài khoản"
        />
        <SettingsGroup
          rows={[
            {
              description: 'Chỉ người bạn chấp nhận mới xem được bài viết.',
              icon: 'LockKey',
              key: 'private',
              label: 'Tài khoản riêng tư',
              onPress: () => void handleTogglePrivate(),
              toggle: user?.isPrivate ?? false,
            },
            {
              description: 'Bật qua màn hình giải thích rủi ro.',
              icon: 'Mask',
              key: 'anonymous',
              label: 'Nhận tin nhắn ẩn danh',
              // Turning it on goes through the risk warning; off is immediate.
              onPress: () => navigation.open('AnonymousMessages'),
              toggle: user?.allowAnonymousMessages ?? false,
            },
            {
              icon: 'UserPlus',
              key: 'requests',
              label: 'Yêu cầu theo dõi',
              onPress: () => navigation.open('FollowRequests'),
            },
            {
              icon: 'Prohibit',
              key: 'blocked',
              label: 'Người dùng đã chặn',
              onPress: () => navigation.open('BlockedUsers'),
            },
          ]}
          title="Quyền riêng tư"
        />
        <SettingsGroup
          rows={[
            {
              icon: 'Flag',
              key: 'terms',
              label: 'Điều khoản sử dụng',
              onPress: () => navigation.open('Legal', { doc: 'terms' }),
            },
            {
              icon: 'EyeSlash',
              key: 'privacy',
              label: 'Chính sách quyền riêng tư',
              onPress: () => navigation.open('Legal', { doc: 'privacy' }),
            },
            {
              icon: 'ShieldCheck',
              key: 'community',
              label: 'Tiêu chuẩn cộng đồng',
              onPress: () => navigation.open('Legal', { doc: 'community' }),
            },
            {
              icon: 'Sparkle',
              key: 'version',
              label: 'Phiên bản',
              onPress: () => undefined,
              readOnly: true,
              value: appConfig.expo.version,
            },
          ]}
          title="Giới thiệu"
        />
        <SettingsGroup
          rows={[
            {
              icon: 'SignOut',
              key: 'signout',
              label: 'Đăng xuất',
              onPress: () => setIsSignOutVisible(true),
              value: user?.username ? `@${user.username}` : undefined,
            },
          ]}
          title="Phiên đăng nhập"
        />
        <SettingsGroup
          rows={[
            {
              description: 'Xoá vĩnh viễn hồ sơ, bài viết và dữ liệu của bạn.',
              destructive: true,
              icon: 'Trash',
              key: 'delete',
              label: 'Xoá tài khoản',
              onPress: () => navigation.open('DeleteAccount'),
            },
          ]}
        />
      </ScrollView>

      <ConfirmModal
        confirmLabel="Đăng xuất"
        icon="SignOut"
        isBusy={isSigningOut}
        message="Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng."
        onCancel={() => setIsSignOutVisible(false)}
        onConfirm={handleSignOut}
        title="Đăng xuất khỏi tài khoản?"
        visible={isSignOutVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: clayColors.canvas,
    flex: 1,
  },
  group: {
    marginTop: claySpacing.xl,
  },
  groupRows: {
    backgroundColor: clayColors.surface,
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
    paddingHorizontal: clayDimensions.gutter,
  },
  groupTitle: {
    color: clayColors.caption,
    paddingBottom: claySpacing.sm,
    paddingHorizontal: clayDimensions.gutter,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: 52,
    paddingVertical: claySpacing.sm,
  },
  rowDescription: {
    color: clayColors.caption,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  rowDivider: {
    borderTopColor: clayColors.rule,
    borderTopWidth: 1,
  },
  rowIcon: {
    alignItems: 'center',
    width: 16,
  },
  rowLabel: {
    fontSize: 15,
  },
  rowPressed: {
    backgroundColor: clayColors.surfaceWell,
    marginHorizontal: -clayDimensions.gutter,
    paddingHorizontal: clayDimensions.gutter,
  },
  rowText: {
    flex: 1,
  },
  rowValue: {
    color: clayColors.caption,
    flexShrink: 1,
    fontFamily: fontFamilies.regular,
    maxWidth: '50%',
  },
});
