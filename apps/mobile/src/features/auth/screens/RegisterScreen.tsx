import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'react-native';

import { PlaceholderScreen } from '../../../components/common/PlaceholderScreen';
import type { AuthStackParamList } from '../../../navigation/types';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  return (
    <PlaceholderScreen
      title="Register"
      description="Registration UI will be implemented in the next phase."
    >
      <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
    </PlaceholderScreen>
  );
}
