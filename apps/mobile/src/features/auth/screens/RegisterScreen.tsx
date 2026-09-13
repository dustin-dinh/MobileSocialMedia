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
  type RegisterFormValues,
  validateRegister,
} from '../validation';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const INITIAL_VALUES: RegisterFormValues = {
  confirmPassword: '',
  email: '',
  password: '',
  username: '',
};

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterFormValues>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const confirmPasswordInputRef = useRef<TextInput | null>(null);

  const updateField = (field: keyof RegisterFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setNotice(null);
  };

  const handleSubmit = () => {
    const nextErrors = validateRegister(values);

    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // TODO(Phase 4): Send these validated values through the confirmed authentication API.
    setNotice('Authentication is not connected yet. No registration request was sent.');
  };

  return (
    <AuthScreenContainer
      footerActionLabel="Log in"
      footerPrompt="Already have an account?"
      onFooterAction={() => navigation.navigate('Login')}
      subtitle="Create your account to join the conversation."
      title="Create your account"
    >
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        error={errors.username}
        label="Username"
        onChangeText={(value) => updateField('username', value)}
        onSubmitEditing={() => emailInputRef.current?.focus()}
        placeholder="Choose a username"
        returnKeyType="next"
        textContentType="username"
        value={values.username}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        error={errors.email}
        inputRef={emailInputRef}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => updateField('email', value)}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={values.email}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        error={errors.password}
        inputRef={passwordInputRef}
        label="Password"
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        password
        placeholder="Create a password"
        returnKeyType="next"
        textContentType="newPassword"
        value={values.password}
      />
      <AuthTextInput
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        error={errors.confirmPassword}
        inputRef={confirmPasswordInputRef}
        label="Confirm password"
        onChangeText={(value) => updateField('confirmPassword', value)}
        onSubmitEditing={handleSubmit}
        password
        placeholder="Re-enter your password"
        returnKeyType="done"
        textContentType="newPassword"
        value={values.confirmPassword}
      />
      <FormMessage message={notice} />
      <PrimaryButton label="Create account" onPress={handleSubmit} />
    </AuthScreenContainer>
  );
}
