import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';

describe('simplifiedAPI error handling', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('handles non-JSON API errors gracefully with empty catch block', async () => {
    // Mock fetch to return a response that will fail JSON parsing in the .catch block
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('Plain text error: Something went wrong', {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    // This should throw a GoogleDriveError (the empty catch block returns {} which will fail zod parsing)
    // The mutation on line 62 changes the empty object to undefined, but both cause zod parse errors
    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toThrow();

    // Due to retry logic, fetch may be called multiple times (1 initial + up to 3 retries)
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('handles malformed JSON API errors', async () => {
    // Mock fetch to return a response with malformed JSON
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('{ "error": { code: invalid } }', {
        status: HttpStatusCode.BAD_REQUEST,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    // This should throw a GoogleDriveError (the empty catch block returns {} which will fail zod parsing)
    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles valid Google API errors with proper error propagation', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.NOT_FOUND,
            message: 'File not found',
          },
        }),
        { status: HttpStatusCode.NOT_FOUND },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.NOT_FOUND,
      name: 'GoogleDriveError',
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles API errors during file operations with proper error propagation', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.FORBIDDEN,
            message: 'Permission denied',
          },
        }),
        { status: HttpStatusCode.FORBIDDEN },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { update } = await import('./simplifiedAPI');

    await expect(update({ ACCESS_TOKEN: 'token' }, 'file-id', {})).rejects.toMatchObject({
      code: HttpStatusCode.FORBIDDEN,
      name: 'GoogleDriveError',
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles API errors during create operations with proper error propagation', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        }),
        { status: HttpStatusCode.UNAUTHORIZED },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { create } = await import('./simplifiedAPI');

    await expect(
      create({ ACCESS_TOKEN: 'token' }, { name: 'test.txt', parents: ['parent-id'] }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.UNAUTHORIZED,
      name: 'GoogleDriveError',
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles API errors during upload operations with proper error propagation', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.PAYLOAD_TOO_LARGE,
            message: 'File too large',
          },
        }),
        { status: HttpStatusCode.PAYLOAD_TOO_LARGE },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { upload } = await import('./simplifiedAPI');

    await expect(upload({ ACCESS_TOKEN: 'token' }, 'file-id', 'content')).rejects.toMatchObject({
      code: HttpStatusCode.PAYLOAD_TOO_LARGE,
      name: 'GoogleDriveError',
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not preserve raw Google API messages that may contain file ids or names', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.NOT_FOUND,
            message: 'File gd-123 "Tax 2025" was not found in folder Private',
          },
        }),
        { status: HttpStatusCode.NOT_FOUND },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    const error = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    ).catch((caughtError: unknown) => caughtError);

    expect(error).toMatchObject({
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });
    expect(error).not.toHaveProperty(
      'message',
      'File gd-123 "Tax 2025" was not found in folder Private',
    );
  });

  it('wraps a network/unknown fetch failure into a GoogleDriveError with a stable code', async () => {
    const networkFailure = new TypeError('Failed to fetch');
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(networkFailure);

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    const error = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    ).catch((caughtError: unknown) => caughtError);

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.SERVICE_UNAVAILABLE,
      message: 'Google Drive request failed',
    });
    // The raw network error must not leak through as-is; only a safe synthetic cause.
    expect(error).not.toMatchObject({ cause: networkFailure });
  });

  it('wraps a malformed/unexpected Google API response into a GoogleDriveError with a stable code', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ files: 'not-an-array' }), {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    const error = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    ).catch((caughtError: unknown) => caughtError);

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.BAD_GATEWAY,
      message: 'Google Drive response was malformed',
    });
    // No raw response body/zod issue details should be exposed.
    expect(JSON.stringify(error)).not.toContain('not-an-array');
  });

  it('wraps a non-JSON successful response into a coded GoogleDriveError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('<html>not json</html>', {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    const error = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    ).catch((caughtError: unknown) => caughtError);

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.BAD_GATEWAY,
      message: 'Google Drive response was malformed',
    });
    expect(error).not.toBeInstanceOf(SyntaxError);
    expect(JSON.stringify(error)).not.toContain('not json');
  });

  it('wraps a malformed JSON successful response into a coded GoogleDriveError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('{ files: [ }', {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { getGFileMetaList } = await import('./simplifiedAPI');

    const error = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    ).catch((caughtError: unknown) => caughtError);

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.BAD_GATEWAY,
      message: 'Google Drive response was malformed',
    });
    expect(error).not.toBeInstanceOf(SyntaxError);
  });
});
