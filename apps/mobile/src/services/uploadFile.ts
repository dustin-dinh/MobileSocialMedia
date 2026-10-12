import { ApiError } from './apiError';

type UploadFileOptions = {
  /** Headers the storage expects (the signed URL is tied to the content type). */
  headers: Record<string, string>;
  /** Called with a fraction between 0 and 1 while the file is being sent. */
  onProgress?: (fraction: number) => void;
  /** Local file URI (`file://...` or `content://...`). */
  uri: string;
  /** Signed upload URL from `POST /media/upload-url`. */
  url: string;
};

/**
 * Sends a local file straight to storage with a signed `PUT`, so a video never
 * passes through the API server. Uses XMLHttpRequest because `fetch` has no
 * upload progress in React Native; works the same on Android and iOS.
 */
export function uploadFile({ headers, onProgress, uri, url }: UploadFileOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const fail = (message: string, status?: number) =>
      reject(new ApiError({ kind: status === undefined ? 'network' : 'server', message, status }));

    request.open('PUT', url);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        fail('Không tải được tệp lên. Vui lòng thử lại.', request.status);
      }
    };
    request.onerror = () => fail('Mất kết nối khi đang tải tệp lên. Vui lòng thử lại.');
    request.ontimeout = () => fail('Tải tệp lên quá lâu. Vui lòng thử lại.');

    // React Native streams the file from disk when the body is `{ uri }`.
    request.send({ uri } as unknown as XMLHttpRequestBodyInit);
  });
}
