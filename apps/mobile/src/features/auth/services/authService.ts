import type { LoginFormValues, RegisterFormValues } from '../validation';

export type AuthOperation = 'login' | 'logout' | 'register';

export class AuthContractUnavailableError extends Error {
  readonly operation: AuthOperation;

  constructor(operation: AuthOperation) {
    super(`${operation.charAt(0).toUpperCase()}${operation.slice(1)} API details are pending backend confirmation.`);

    this.name = 'AuthContractUnavailableError';
    this.operation = operation;
  }
}

// When Dev B confirms an endpoint, map the form values here and call httpClient.requestJson.
// Do not add a URL, request shape, response type, or token handling before that confirmation.
export const authService = {
  async login(_values: LoginFormValues): Promise<never> {
    throw new AuthContractUnavailableError('login');
  },
  async logout(): Promise<never> {
    throw new AuthContractUnavailableError('logout');
  },
  async register(_values: RegisterFormValues): Promise<never> {
    throw new AuthContractUnavailableError('register');
  },
} as const;
