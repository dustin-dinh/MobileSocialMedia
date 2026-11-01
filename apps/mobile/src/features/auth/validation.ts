import { birthDateProblem } from './birthDate';

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  /** DD/MM/YYYY as typed. */
  birthDate: string;
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
    errors.email = 'Nhập địa chỉ email.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.';
  }

  if (!values.password) {
    errors.password = 'Nhập mật khẩu.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu cần ít nhất ' + MIN_PASSWORD_LENGTH + ' ký tự.';
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu tối đa ' + MAX_PASSWORD_LENGTH + ' ký tự.';
  }

  return errors;
}

export function validateRegister(
  values: RegisterFormValues,
): FieldErrors<keyof RegisterFormValues> {
  const errors: FieldErrors<keyof RegisterFormValues> = {};

  if (!values.username.trim()) {
    errors.username = 'Nhập tên người dùng.';
  } else if (values.username.trim().length < 3 || values.username.trim().length > 30) {
    errors.username = 'Tên người dùng dài từ 3 đến 30 ký tự.';
  } else if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = 'Chỉ dùng chữ không dấu, số, dấu chấm và gạch dưới.';
  }

  if (!values.email.trim()) {
    errors.email = 'Nhập địa chỉ email.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.';
  } else if (values.email.trim().length > 255) {
    errors.email = 'Email tối đa 255 ký tự.';
  }

  if (!values.password) {
    errors.password = 'Nhập mật khẩu.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu cần ít nhất ' + MIN_PASSWORD_LENGTH + ' ký tự.';
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu tối đa ' + MAX_PASSWORD_LENGTH + ' ký tự.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Nhập lại mật khẩu.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Hai mật khẩu chưa khớp nhau.';
  }

  const birthProblem = birthDateProblem(values.birthDate);

  if (birthProblem) {
    errors.birthDate = REGISTER_BIRTH_DATE_ERRORS[birthProblem];
  }

  return errors;
}

const REGISTER_BIRTH_DATE_ERRORS = {
  future: 'Ngày sinh không thể ở tương lai.',
  invalid: 'Nhập ngày sinh theo dạng NN/TT/NNNN, ví dụ 05/09/1998.',
  missing: 'Nhập ngày sinh của bạn.',
  underage: 'Bạn cần từ 18 tuổi trở lên để dùng Mobile Social.',
} as const;

export type ForgotPasswordFormValues = {
  email: string;
};

export function validateForgotPassword(
  values: ForgotPasswordFormValues,
): FieldErrors<keyof ForgotPasswordFormValues> {
  const errors: FieldErrors<keyof ForgotPasswordFormValues> = {};

  if (!values.email.trim()) {
    errors.email = 'Nhập địa chỉ email.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Email chưa đúng định dạng, ví dụ ten.ban@gmail.com.';
  } else if (values.email.trim().length > 255) {
    errors.email = 'Email tối đa 255 ký tự.';
  }

  return errors;
}

export type NewPasswordFormValues = {
  confirmPassword: string;
  password: string;
};

export function validateNewPassword(
  values: NewPasswordFormValues,
): FieldErrors<keyof NewPasswordFormValues> {
  const errors: FieldErrors<keyof NewPasswordFormValues> = {};

  if (!values.password) {
    errors.password = 'Nhập mật khẩu.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu cần ít nhất ' + MIN_PASSWORD_LENGTH + ' ký tự.';
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = 'Mật khẩu tối đa ' + MAX_PASSWORD_LENGTH + ' ký tự.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Nhập lại mật khẩu.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Hai mật khẩu chưa khớp nhau.';
  }

  return errors;
}

export function validateVerificationCode(code: string): string | undefined {
  const trimmed = code.trim();
  if (!trimmed) {
    return 'Nhập mã xác minh gồm 6 chữ số.';
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return 'Mã xác minh gồm đúng 6 chữ số.';
  }
  return undefined;
}
