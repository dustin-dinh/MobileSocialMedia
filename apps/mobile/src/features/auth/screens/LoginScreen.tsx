import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import type { AuthStackParamList } from '../../../navigation/types';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  type FieldErrors,
  type LoginFormValues,
  validateLogin,
} from '../validation';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const INITIAL_VALUES: LoginFormValues = {
  identifier: '',
  password: '',
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [errors, setErrors] = useState<FieldErrors<keyof LoginFormValues>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const passwordInputRef = useRef<TextInput | null>(null);

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setNotice(null);
  };

  const handleSubmit = () => {
    const nextErrors = validateLogin(values);

    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // TODO(Phase 4): Send these validated values through the confirmed authentication API.
    setNotice('Authentication is not connected yet. No sign-in request was sent.');
  };

  return (
    <AuthScreenContainer
      footerActionLabel="Create account"
      footerPrompt="New to Mobile Social?"
      onFooterAction={() => navigation.navigate('Register')}
      subtitle="Sign in to continue sharing with your community."
      title="Welcome back"
    >
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        error={errors.identifier}
        keyboardType="email-address"
        label="Username or email"
        onChangeText={(value) => updateField('identifier', value)}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="username"
        value={values.identifier}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        error={errors.password}
        inputRef={passwordInputRef}
        label="Password"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={handleSubmit}
        password
        placeholder="Enter your password"
        returnKeyType="done"
        textContentType="password"
        value={values.password}
      />
      <FormMessage message={notice} />
      <PrimaryButton label="Log in" onPress={handleSubmit} />
    </AuthScreenContainer>
  );
}
