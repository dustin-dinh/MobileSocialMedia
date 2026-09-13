export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type RegisterFormValues = {
  confirmPassword: string;
  email: string;
  password: string;
  username: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginFormValues): FieldErrors<keyof LoginFormValues> {
  const errors: FieldErrors<keyof LoginFormValues> = {};

  if (!values.identifier.trim()) {
    errors.identifier = 'Enter your username or email.';
  }

  if (!values.password) {
    errors.password = 'Enter your password.';
  }

  return errors;
}

export function validateRegister(
  values: RegisterFormValues,
): FieldErrors<keyof RegisterFormValues> {
  const errors: FieldErrors<keyof RegisterFormValues> = {};

  if (!values.username.trim()) {
    errors.username = 'Enter a username.';
  }

  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Enter a password.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
