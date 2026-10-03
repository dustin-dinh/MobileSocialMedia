import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clayColors } from '../theme/colors';
import { clayDimensions } from '../theme/spacing';
import { ClaySurface } from '../components/ui/ClaySurface';
import { ClayIcon, PhosphorIconName } from '../components/icons/ClayIcon';

const TAB_ICONS: Record<string, { icon: PhosphorIconName; label: string }> = {
  Home: { icon: 'House', label: 'Home' },
  Search: { icon: 'MagnifyingGlass', label: 'Search' },
  Create: { icon: 'Plus', label: 'Create post' },
  Notifications: { icon: 'Bell', label: 'Notifications' },
  Profile: { icon: 'User', label: 'Profile' },
};

export function ClayTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomInset }]}
    >
      <ClaySurface variant="pill" style={styles.container}>
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

          if (isCreate) {
            return (
              <View key={route.key} style={styles.createBtnWrapper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? tabMeta.label}
                  accessibilityState={{ selected: isFocused }}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  hitSlop={8}
                  style={styles.createPressable}
                >
                  <ClaySurface
                    variant="raisedPrimary"
                    borderRadius={26}
                    style={styles.createSurface}
                  >
                    <ClayIcon
                      name="Plus"
                      size={26}
                      weight="bold"
                      color={clayColors.onPrimary}
                    />
                  </ClaySurface>
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
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
                weight={isFocused ? 'fill' : 'duotone'}
                color={isFocused ? clayColors.tabBarIconActive : clayColors.tabBarIcon}
              />
              {isFocused && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </ClaySurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
    backgroundColor: clayColors.tabBarBg,
  },
  tabButton: {
    flex: 1,
    height: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: clayColors.tabBarActiveDot,
    marginTop: 3,
  },
  createBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  createPressable: {
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSurface: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: clayColors.primary,
  },
});
