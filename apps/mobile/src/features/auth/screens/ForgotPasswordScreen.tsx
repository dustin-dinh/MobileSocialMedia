import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  return (
    <View style={styles.container} accessibilityLabel="Forgot password screen">
      <ClayText variant="title">Forgot Password</ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
