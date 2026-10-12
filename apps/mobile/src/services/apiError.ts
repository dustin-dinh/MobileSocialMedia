export type ApiErrorKind = 'configuration' | 'network' | 'server' | 'unauthorized' | 'unknown';

type ApiErrorOptions = {
  /** Machine-readable code from the API body (e.g. `EMAIL_NOT_VERIFIED`). */
  code?: string;
  kind: ApiErrorKind;
  message: string;
  status?: number;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor({ code, kind, message, status }: ApiErrorOptions) {
    super(message);

    this.code = code;
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}
