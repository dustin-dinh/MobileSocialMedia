import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { UserListScreen } from '../../../components/common/UserListScreen';
import { ClayText } from '../../../components/ui/ClayText';
import { USE_MOCK_API } from '../../../config/runtime';
import type { MainStackParamList } from '../../../navigation/types';
import { followApi } from '../../../services/followApi';
import { clayColors } from '../../../theme/colors';
import { clayDimensions, claySpacing } from '../../../theme/spacing';
import { fontFamilies } from '../../../theme/typography';

type FollowListScreenProps = NativeStackScreenProps<MainStackParamList, 'FollowList'>;
type FollowListType = MainStackParamList['FollowList']['type'];

const TABS: Array<{ key: FollowListType; label: string }> = [
  { key: 'followers', label: 'Người theo dõi' },
  { key: 'following', label: 'Đang theo dõi' },
];

/** Followers / following of a user, with a follow button on every row. */
export function FollowListScreen({ route }: FollowListScreenProps) {
  const { userId } = route.params;
  const [type, setType] = useState<FollowListType>(route.params.type);

  const fetchPage = useCallback(
    async (page: number) =>
      USE_MOCK_API
        ? { hasMore: false, users: [] }
        : followApi.listUsers(`users/${userId}/${type}`, page),
    [type, userId],
  );

  return (
    <UserListScreen
      emptyText={
        type === 'followers' ? 'Chưa có người theo dõi nào.' : 'Chưa theo dõi ai.'
      }
      fetchPage={fetchPage}
      header={
        <View accessibilityRole="tablist" style={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = tab.key === type;

            return (
              <Pressable
                accessibilityLabel={`Xem ${tab.label.toLowerCase()}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={tab.key}
                onPress={() => setType(tab.key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <ClayText
                  variant="body"
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </ClayText>
              </Pressable>
            );
          })}
        </View>
      }
      title={type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
    />
  );
}

const styles = StyleSheet.create({
  // Underline tabs, each as wide as its label, on one full-width rule (same as the profile tabs).
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    justifyContent: 'center',
    marginBottom: -1,
    minHeight: clayDimensions.minTouchTarget,
  },
  tabActive: {
    borderBottomColor: clayColors.primary,
  },
  tabText: {
    color: clayColors.caption,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
  tabTextActive: {
    color: clayColors.text,
    fontFamily: fontFamilies.semiBold,
  },
  tabs: {
    backgroundColor: clayColors.canvas,
    borderBottomColor: clayColors.border,
    borderBottomWidth: 1,
    columnGap: claySpacing.xl,
    flexDirection: 'row',
    paddingHorizontal: clayDimensions.gutter,
  },
});
