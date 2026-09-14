export type ApiErrorKind = 'configuration' | 'network' | 'server' | 'unauthorized' | 'unknown';

type ApiErrorOptions = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor({ kind, message, status }: ApiErrorOptions) {
    super(message);

    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}
