import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';

type VerifyCodeScreenProps = NativeStackScreenProps<AuthStackParamList, 'VerifyCode'>;

export function VerifyCodeScreen({ navigation, route }: VerifyCodeScreenProps) {
  return (
    <View style={styles.container} accessibilityLabel="Verification code screen">
      <ClayText variant="title">Verify Code</ClayText>
      <ClayText variant="body">{route.params.email}</ClayText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
