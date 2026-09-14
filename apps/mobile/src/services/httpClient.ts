import { getApiBaseUrl } from '../config/api';
import { ApiError } from './apiError';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type JsonRequestOptions<TBody> = {
  body?: TBody;
  headers?: Record<string, string>;
  method: HttpMethod;
  path: string;
  signal?: AbortSignal;
};

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

async function requestJson<TResponse, TBody = undefined>(
  options: JsonRequestOptions<TBody>,
): Promise<TResponse> {
  let requestUrl: string;

  try {
    requestUrl = createApiUrl(options.path);
  } catch {
    throw new ApiError({
      kind: 'configuration',
      message: 'The app API base URL is not configured correctly.',
    });
  }

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      method: options.method,
      signal: options.signal,
    });
  } catch {
    throw new ApiError({
      kind: 'network',
      message: 'Unable to reach the server. Check your connection and try again.',
    });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiError({
      kind: response.status === 401 ? 'unauthorized' : 'server',
      message:
        response.status === 401
          ? 'The server did not authorize this request.'
          : 'The server could not complete this request.',
      status: response.status,
    });
  }

  if (payload === undefined) {
    throw new ApiError({
      kind: 'unknown',
      message: 'The server returned an unexpected response.',
      status: response.status,
    });
  }

  return payload as TResponse;
}

export const httpClient = {
  requestJson,
} as const;
