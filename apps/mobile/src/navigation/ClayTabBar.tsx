import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clayColors } from '../theme/colors';
import { clayDimensions } from '../theme/spacing';
import { ClayIcon, PhosphorIconName } from '../components/icons/ClayIcon';
import { ClayText } from '../components/ui/ClayText';
import { useUnreadNotifications } from '../features/notifications/unreadStore';

const TAB_ICONS: Record<string, { icon: PhosphorIconName; label: string }> = {
  Home: { icon: 'House', label: 'Home' },
  Search: { icon: 'MagnifyingGlass', label: 'Search' },
  Create: { icon: 'Plus', label: 'Create post' },
  Notifications: { icon: 'Bell', label: 'Notifications' },
  Profile: { icon: 'User', label: 'Profile' },
};

/**
 * Bottom tab bar: attached to the bottom edge with a hairline on top. It sits
 * in the layout (not floating), so screens need no extra bottom padding, and
 * it absorbs the bottom safe-area inset (iOS home indicator, Android gesture bar).
 */
export function ClayTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadNotifications();

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
            {isCreate ? (
              <View style={styles.createBox}>
                <ClayIcon name="Plus" size={20} weight="bold" color={clayColors.textSecondary} />
              </View>
            ) : (
              <ClayIcon
                name={tabMeta.icon}
                size={26}
                weight={isFocused ? 'fill' : 'regular'}
                color={isFocused ? clayColors.tabBarIconActive : clayColors.tabBarIcon}
              />
            )}
            {route.name === 'Notifications' && unreadCount > 0 ? (
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
    top: 6,
  },
  badgeText: {
    color: clayColors.onPrimary,
    fontSize: 10,
    lineHeight: 14,
  },
  container: {
    backgroundColor: clayColors.tabBarBg,
    borderTopColor: clayColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  createBox: {
    alignItems: 'center',
    backgroundColor: clayColors.surfaceWell,
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 46,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    height: clayDimensions.tabBarHeight,
    justifyContent: 'center',
    minWidth: clayDimensions.minTouchTarget,
  },
});
