import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clayColors } from '../theme/colors';
import { clayDimensions } from '../theme/spacing';
import { fontFamilies, tabularNums } from '../theme/typography';
import { ClayIcon, ClayIconName } from '../components/icons/ClayIcon';
import { ClayText } from '../components/ui/ClayText';
import { useUnreadMessages } from '../features/messages/unreadMessages';

const TAB_ICONS: Record<string, { icon: ClayIconName; label: string }> = {
  Home: { icon: 'House', label: 'Trang chủ' },
  Search: { icon: 'MagnifyingGlass', label: 'Tìm kiếm' },
  Create: { icon: 'PlusSquare', label: 'Đăng' },
  Messages: { icon: 'ChatCircle', label: 'Tin nhắn' },
  Profile: { icon: 'User', label: 'Cá nhân' },
};

/**
 * Bottom tab bar: five destinations with short labels, attached to the bottom
 * edge with one 1px rule on top. The active tab is the brand hue (icon and
 * label); the rest are grey. It sits in the layout (not floating), so screens
 * need no extra bottom padding, and it absorbs the bottom safe-area inset
 * (iOS home indicator, Android gesture bar).
 */
export function ClayTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadMessages();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const tabMeta = TAB_ICONS[route.name] ?? { icon: 'House', label: route.name };
        const isCreate = route.name === 'Create';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole={isCreate ? 'button' : 'tab'}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? tabMeta.label}
            accessibilityState={{ selected: isFocused }}
            onPress={onPress}
            onLongPress={onLongPress}
            hitSlop={6}
            style={styles.tabButton}
          >
            <ClayIcon
              name={tabMeta.icon}
              size={24}
              weight={isFocused && !isCreate ? 'fill' : 'regular'}
              color={isFocused ? clayColors.tabBarIconActive : clayColors.tabBarIcon}
            />
            <ClayText
              numberOfLines={1}
              style={[styles.label, isFocused && styles.labelActive]}
              variant="meta"
            >
              {tabMeta.label}
            </ClayText>
            {route.name === 'Messages' && unreadCount > 0 ? (
              <View style={styles.badge}>
                <ClayText variant="meta" style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </ClayText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: clayColors.error,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    left: '50%',
    marginLeft: 4,
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    top: 4,
  },
  badgeText: {
    color: clayColors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    lineHeight: 14,
    ...tabularNums,
  },
  container: {
    backgroundColor: clayColors.tabBarBg,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  label: {
    color: clayColors.tabBarIcon,
    fontFamily: fontFamilies.medium,
    marginTop: 2,
  },
  labelActive: {
    color: clayColors.tabBarIconActive,
    fontFamily: fontFamilies.semiBold,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    height: clayDimensions.tabBarHeight,
    justifyContent: 'center',
    paddingTop: 2,
    minWidth: clayDimensions.minTouchTarget,
  },
});
