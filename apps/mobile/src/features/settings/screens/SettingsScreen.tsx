import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import appConfig from '../../../../app.json';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { showToast } from '../../../components/common/toast';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClaySurface } from '../../../components/ui/ClaySurface';
import { ClayText } from '../../../components/ui/ClayText';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { useAuthSession } from '../../auth/authSession';

type Row = {
  destructive?: boolean;
  icon: string;
  key: string;
  label: string;
  onPress: () => void;
  /** Right-aligned detail text instead of a chevron (read-only rows). */
  value?: string;
};

function SettingsGroup({ rows, title }: { rows: Row[]; title: string }) {
  return (
    <View style={styles.group}>
      <ClayText style={styles.groupTitle} variant="meta">
        {title}
      </ClayText>
      <ClaySurface style={styles.groupCard} variant="raisedLite">
        {rows.map((row, index) => {
          const color = row.destructive ? clayColors.error : clayColors.text;

          return (
            <Pressable
              accessibilityLabel={row.label}
              accessibilityRole="button"
              disabled={row.value !== undefined}
              key={row.key}
              onPress={row.onPress}
              style={[styles.row, index > 0 && styles.rowDivider]}
            >
              <ClayIcon color={color} name={row.icon} size={20} weight="duotone" />
              <ClayText style={[styles.rowLabel, { color }]} variant="body">
                {row.label}
              </ClayText>
              {row.value !== undefined ? (
                <ClayText numberOfLines={1} style={styles.rowValue} variant="meta">
                  {row.value}
                </ClayText>
              ) : (
                <ClayIcon color={clayColors.caption} name="CaretRight" size={16} weight="bold" />
              )}
            </Pressable>
          );
        })}
      </ClaySurface>
    </View>
  );
}

/** Account settings: profile, password, blocked users, legal pages, sign out, delete account. */
export function SettingsScreen() {
  const navigation = useAppNavigation();
  const { signOut, user } = useAuthSession();
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsGroup
          rows={[
            { icon: 'User', key: 'email', label: 'Email', onPress: () => undefined, value: user?.email ?? '' },
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
              icon: 'Sparkle',
              key: 'version',
              label: 'Phiên bản',
              onPress: () => undefined,
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
            },
            {
              destructive: true,
              icon: 'Trash',
              key: 'delete',
              label: 'Xoá tài khoản',
              onPress: () => navigation.open('DeleteAccount'),
            },
          ]}
          title="Phiên đăng nhập"
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
  content: {
    padding: claySpacing.base,
    paddingBottom: 48,
  },
  group: {
    marginBottom: claySpacing.lg,
  },
  groupCard: {
    paddingHorizontal: claySpacing.base,
  },
  groupTitle: {
    color: clayColors.caption,
    marginBottom: claySpacing.sm,
    marginLeft: claySpacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: claySpacing.md,
    minHeight: clayDimensions.minTouchTarget + 8,
  },
  rowDivider: {
    borderTopColor: clayColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    color: clayColors.caption,
    flexShrink: 1,
    maxWidth: '55%',
  },
});
