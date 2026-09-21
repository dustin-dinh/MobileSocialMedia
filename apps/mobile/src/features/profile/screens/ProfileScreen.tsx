import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '../../../components/common/PlaceholderScreen';
import { useAuthSession } from '../../auth/authSession';
import { useAuthSubmission } from '../../auth/hooks/useAuthSubmission';

export function ProfileScreen() {
  const { signOut, user } = useAuthSession();
  const { isSubmitting, submit, submissionMessage } = useAuthSubmission();

  const handleSignOut = () => {
    void submit(signOut);
  };

  return (
    <PlaceholderScreen
      description={user ? 'Signed in as @' + user.username : 'Your profile is unavailable.'}
      title="Profile"
    >
      <View style={styles.actions}>
        {submissionMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {submissionMessage}
          </Text>
        ) : null}
        <Pressable
          accessibilityLabel="Log out"
          accessibilityRole="button"
          accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.button,
            isSubmitting ? styles.buttonDisabled : undefined,
            pressed && !isSubmitting ? styles.buttonPressed : undefined,
          ]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Logging out…' : 'Log out'}</Text>
        </Pressable>
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    minWidth: 220,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    backgroundColor: '#1D4ED8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
});
