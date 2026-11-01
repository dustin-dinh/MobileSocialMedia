import { type RefObject, useState } from 'react';
import { Pressable, StyleSheet, type TextInput, type TextInputProps } from 'react-native';

import { clayColors } from '../../../theme/colors';
import { clayDimensions } from '../../../theme/spacing';
import { ClayIcon } from '../../../components/icons/ClayIcon';
import { ClayInput } from '../../../components/ui/ClayInput';
import { ClayText } from '../../../components/ui/ClayText';

type AuthTextInputProps = TextInputProps & {
  error?: string;
  /** Help under the field, hidden while an error is shown. */
  hint?: string;
  inputRef?: RefObject<TextInput | null>;
  label: string;
  password?: boolean;
};

/** The app's text field (label above, 1px control edge) with a show/hide toggle for passwords. */
export function AuthTextInput({
  accessibilityLabel,
  error,
  hint,
  label,
  password = false,
  ...inputProps
}: AuthTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <>
      <ClayInput
        {...inputProps}
        accessibilityHint={error}
        accessibilityLabel={accessibilityLabel ?? label}
        containerStyle={hint && !error ? styles.withHint : undefined}
        error={error}
        label={label}
        rightAction={
          password ? (
            <Pressable
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              style={styles.visibilityAction}
            >
              <ClayIcon
                color={clayColors.caption}
                name={isPasswordVisible ? 'EyeSlash' : 'Eye'}
                size={20}
              />
            </Pressable>
          ) : undefined
        }
        secureTextEntry={password ? !isPasswordVisible : inputProps.secureTextEntry}
      />
      {hint && !error ? (
        <ClayText variant="meta" style={styles.hint}>
          {hint}
        </ClayText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginBottom: 16,
    marginTop: 6,
  },
  visibilityAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
    minHeight: clayDimensions.minTouchTarget,
    minWidth: clayDimensions.minTouchTarget,
  },
  withHint: {
    marginBottom: 0,
  },
});
