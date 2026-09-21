export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  confirmPassword: string;
  email: string;
  password: string;
  username: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export function validateLogin(values: LoginFormValues): FieldErrors<keyof LoginFormValues> {
  const errors: FieldErrors<keyof LoginFormValues> = {};

  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Enter your password.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.';
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = 'Password must be at most ' + MAX_PASSWORD_LENGTH + ' characters.';
  }

  return errors;
}

export function validateRegister(
  values: RegisterFormValues,
): FieldErrors<keyof RegisterFormValues> {
  const errors: FieldErrors<keyof RegisterFormValues> = {};

  if (!values.username.trim()) {
    errors.username = 'Enter a username.';
  } else if (values.username.trim().length < 3 || values.username.trim().length > 30) {
    errors.username = 'Username must be between 3 and 30 characters.';
  } else if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = 'Use letters, numbers, dots, or underscores only.';
  }

  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  } else if (values.email.trim().length > 255) {
    errors.email = 'Email must be at most 255 characters.';
  }

  if (!values.password) {
    errors.password = 'Enter a password.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.';
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = 'Password must be at most ' + MAX_PASSWORD_LENGTH + ' characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
