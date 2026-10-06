/**
 * Minimal `fetch` backed by Node's `http` module.
 *
 * The jest-expo preset replaces `fetch` with a stub that never reaches the
 * network, so the live suite installs this one to make real requests. It
 * covers exactly what `httpClient` uses: method, headers, a string or
 * text-only FormData body, abort signals, and `ok` / `status` / `text()`.
 */
import http from 'http';

type FetchInit = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  signal?: AbortSignal;
};

type FormLike = {
  entries?: () => Iterable<[string, unknown]>;
  getParts?: () => Array<{ fieldName: string; string?: string }>;
};

function readTextFields(form: FormLike): Array<[string, string]> {
  if (typeof form.getParts === 'function') {
    return form.getParts().map((part) => [part.fieldName, part.string ?? '']);
  }

  return Array.from(form.entries?.() ?? []).map(([name, value]) => [name, String(value)]);
}

function encodeBody(body: unknown, headers: Record<string, string>): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'string') {
    return body;
  }

  const boundary = `----liveSuite${Date.now().toString(16)}`;
  const parts = readTextFields(body as FormLike).map(
    ([name, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
  );

  headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

  return `${parts.join('')}--${boundary}--\r\n`;
}

export function installNodeFetch(): void {
  const nodeFetch = (url: string, init: FetchInit = {}) =>
    new Promise((resolve, reject) => {
      const headers = { ...init.headers };
      const body = encodeBody(init.body, headers);

      if (body !== undefined) {
        headers['Content-Length'] = String(Buffer.byteLength(body));
      }

      const request = http.request(url, { headers, method: init.method ?? 'GET' }, (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const status = response.statusCode ?? 0;

          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: () => Promise.resolve(Buffer.concat(chunks).toString('utf8')),
          });
        });
      });

      request.on('error', reject);
      init.signal?.addEventListener('abort', () => request.destroy(new Error('Aborted')));
      request.end(body);
    });

  (globalThis as { fetch: unknown }).fetch = nodeFetch;
}
