import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import type { MainStackParamList } from '../../../navigation/types';
import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { ProfileView } from '../components/ProfileView';
import { profileColors } from '../profileTheme';

type UserProfileScreenProps = NativeStackScreenProps<MainStackParamList, 'UserProfile'>;

/** Another user's profile, pushed on top of the tabs. */
export function UserProfileScreen({ navigation, route }: UserProfileScreenProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenHeader
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityLabel="Tuỳ chọn khác"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsMenuVisible(true)}
            style={styles.menuButton}
          >
            <ClayIcon color={clayColors.text} name="DotsThree" size={24} weight="bold" />
          </Pressable>
        }
        title="Trang cá nhân"
      />
      <ProfileView
        menuVisible={isMenuVisible}
        onCloseMenu={() => setIsMenuVisible(false)}
        userId={route.params.userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: profileColors.background,
    flex: 1,
  },
  menuButton: {
    alignItems: 'center',
    height: clayDimensions.minTouchTarget,
    justifyContent: 'center',
    width: clayDimensions.minTouchTarget,
  },
});
