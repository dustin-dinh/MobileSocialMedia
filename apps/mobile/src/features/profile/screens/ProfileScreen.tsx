import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import type { MainTabParamList } from '../../../navigation/types';
import { useAuthSession } from '../../auth/authSession';
import { ProfileView } from '../components/ProfileView';
import { profileColors } from '../profileTheme';

type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

/** Profile tab: the signed-in user's own profile. */
export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const handleCreatePost = useCallback(() => {
    navigation.navigate('Create');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {user ? (
        <ProfileView onCreatePost={handleCreatePost} userId={user.id} />
      ) : (
        <ActivityIndicator color={profileColors.primary} size="large" style={styles.loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: profileColors.background,
    flex: 1,
  },
  loading: {
    flex: 1,
  },
});
