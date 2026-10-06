import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInput } from 'react-native';

import { isGoogleSignInAvailable } from '../../../config/google';
import { ClayText } from '../../../components/ui/ClayText';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAuthSession } from '../authSession';
import { authColors } from '../authTheme';
import { AuthDivider } from '../components/AuthDivider';
import { AuthScreenContainer } from '../components/AuthScreenContainer';
import { AuthTextInput } from '../components/AuthTextInput';
import { FormMessage } from '../components/FormMessage';
import { GoogleButton } from '../components/GoogleButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSubmission } from '../hooks/useAuthSubmission';
import {
  type FieldErrors,
  type LoginFormValues,
  validateLogin,
} from '../validation';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export function LoginScreen({ navigation, route }: LoginScreenProps) {
  const [errors, setErrors] = useState<FieldErrors<keyof LoginFormValues>>({});
  const [values, setValues] = useState<LoginFormValues>({
    ...INITIAL_VALUES,
    email: route.params?.email ?? '',
  });
  const [successMessage, setSuccessMessage] = useState(route.params?.message ?? null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const { signIn, signInWithGoogle } = useAuthSession();
  const { isSubmitting, reset, submit, submissionMessage, submissionTone } = useAuthSubmission();

  const showGoogle = isGoogleSignInAvailable();

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setSuccessMessage(null);
    reset();
  };

  const handleSubmit = () => {
    const nextErrors = validateLogin(values);

    setErrors(nextErrors);
    reset();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    void submit(() => signIn(values));
  };

  const handleGoogleSignIn = () => {
    reset();
    setSuccessMessage(null);
    void submit(() => signInWithGoogle());
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
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
        error={errors.email}
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
        autoComplete="current-password"
        autoCorrect={false}
        editable={!isSubmitting}
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
      <Pressable
        accessibilityLabel="Forgot password?"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotPasswordAction}
      >
        <ClayText variant="caption" style={styles.forgotPasswordText}>
          Forgot password?
        </ClayText>
      </Pressable>
      <FormMessage
        message={submissionMessage ?? successMessage}
        tone={submissionMessage ? submissionTone : 'info'}
      />
      <PrimaryButton isLoading={isSubmitting} label="Log in" onPress={handleSubmit} />
      {showGoogle && (
        <>
          <AuthDivider />
          <GoogleButton
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onPress={handleGoogleSignIn}
          />
        </>
      )}
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  forgotPasswordAction: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: 8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: authColors.primary,
  },
});
