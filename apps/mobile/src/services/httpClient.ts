import { getApiBaseUrl } from '../config/api';
import { ApiError } from './apiError';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type JsonRequestOptions<TBody> = {
  body?: TBody;
  headers?: Record<string, string>;
  method: HttpMethod;
  path: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

type RequestSignal = {
  cleanup: () => void;
  didTimeout: () => boolean;
  signal: AbortSignal;
};

function createRequestSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): RequestSignal {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternalSignal = () => {
    controller.abort();
  };

  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternalSignal);
    },
    didTimeout: () => timedOut,
    signal: controller.signal,
  };
}

function createApiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedPath || /^[a-z][a-z\d+.-]*:/i.test(normalizedPath)) {
    throw new Error('A relative API path is required.');
  }

  return `${getApiBaseUrl()}/${normalizedPath}`;
}

async function readJson(response: Response): Promise<unknown | undefined> {
  const responseText = await response.text();

  if (!responseText) {
    return undefined;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getResponseMessage(payload: unknown, fallbackMessage: string): string {
  if (!isRecord(payload)) {
    return fallbackMessage;
  }

  const { message } = payload;

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string => typeof item === 'string' && Boolean(item.trim()),
    );

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return fallbackMessage;
}

async function request<TBody = undefined>(
  options: JsonRequestOptions<TBody>,
): Promise<unknown | undefined> {
  let requestUrl: string;

  try {
    requestUrl = createApiUrl(options.path);
  } catch {
    throw new ApiError({
      kind: 'configuration',
      message: 'The app API base URL is not configured correctly.',
    });
  }

  const requestSignal = createRequestSignal(
    options.signal,
    options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  );
  let response: Response;
  let payload: unknown | undefined;

  try {
    response = await fetch(requestUrl, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      method: options.method,
      signal: requestSignal.signal,
    });

    payload = await readJson(response);
  } catch {
    throw new ApiError({
      kind: 'network',
      message: requestSignal.didTimeout()
        ? 'The server took too long to respond. Check the API connection and try again.'
        : 'Unable to reach the server. Check your connection and try again.',
    });
  } finally {
    requestSignal.cleanup();
  }

  if (!response.ok) {
    const fallbackMessage =
      response.status === 401
        ? 'The server did not authorize this request.'
        : 'The server could not complete this request.';

    throw new ApiError({
      kind: response.status === 401 ? 'unauthorized' : 'server',
      message: getResponseMessage(payload, fallbackMessage),
      status: response.status,
    });
  }

  return payload;
}

async function requestJson<TResponse, TBody = undefined>(
  options: JsonRequestOptions<TBody>,
): Promise<TResponse> {
  const payload = await request(options);

  if (payload === undefined) {
    throw new ApiError({
      kind: 'unknown',
      message: 'The server returned an unexpected response.',
    });
  }

  return payload as TResponse;
}

async function requestVoid<TBody = undefined>(options: JsonRequestOptions<TBody>): Promise<void> {
  await request(options);
}

export const httpClient = {
  requestJson,
  requestVoid,
} as const;
