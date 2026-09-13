import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'react-native';

import { PlaceholderScreen } from '../../../components/common/PlaceholderScreen';
import type { AuthStackParamList } from '../../../navigation/types';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  return (
    <PlaceholderScreen
      title="Login"
      description="Authentication UI will be implemented in the next phase."
    >
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
    </PlaceholderScreen>
  );
}
