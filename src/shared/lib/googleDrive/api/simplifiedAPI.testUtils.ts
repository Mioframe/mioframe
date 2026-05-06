/** Google Drive folder MIME type used by simplified API tests. */
export const createFolderMimeType = 'application/vnd.google-apps.folder';

/**
 * Creates a JSON `Response` for mocked Google Drive API calls.
 * @param payload - The response body to serialize as JSON.
 * @param status  - HTTP status code (defaults to `200`).
 * @returns A new `Response` with the serialized JSON body.
 */
export const createJsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

/**
 * Creates a deferred promise for tests that need explicit async ordering.
 * @returns An object with `promise`, `resolve`, and `reject`.
 */
export const createDeferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};
