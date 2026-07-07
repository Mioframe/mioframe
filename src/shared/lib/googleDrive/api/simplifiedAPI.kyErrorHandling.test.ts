import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';

const { apiClientMock, MockKyHttpError } = vi.hoisted(() => {
  class HoistedMockKyHttpError extends Error {
    response: Response;
    data: unknown;

    constructor(response: Response, data?: unknown) {
      super('Mock HTTPError');
      this.response = response;
      this.data = data;
    }
  }

  return {
    apiClientMock: vi.fn(),
    MockKyHttpError: HoistedMockKyHttpError,
  };
});

vi.mock('ky', () => ({
  default: {
    create: vi.fn(() => apiClientMock),
  },
  HTTPError: MockKyHttpError,
}));

describe('simplifiedAPI ky error normalization', () => {
  beforeEach(() => {
    vi.resetModules();
    apiClientMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes non-ok responses returned directly by the ky client', async () => {
    apiClientMock.mockResolvedValueOnce(
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

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.FORBIDDEN,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes thrown HTTPError responses from the ky client', async () => {
    apiClientMock.mockRejectedValueOnce(
      new MockKyHttpError(
        new Response(
          JSON.stringify({
            error: {
              code: HttpStatusCode.TOO_MANY_REQUESTS,
              message: 'Rate limited',
            },
          }),
          { status: HttpStatusCode.TOO_MANY_REQUESTS },
        ),
        {
          error: {
            code: HttpStatusCode.TOO_MANY_REQUESTS,
            message: 'Rate limited',
          },
        },
      ),
    );

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.TOO_MANY_REQUESTS,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it('uses HTTPError.data as the primary Google error payload source', async () => {
    const response = new Response(null, { status: HttpStatusCode.TOO_MANY_REQUESTS });
    const responseClone = vi.spyOn(response, 'clone').mockImplementation(() => {
      throw new Error('response body already consumed');
    });

    apiClientMock.mockRejectedValueOnce(
      new MockKyHttpError(response, {
        error: {
          code: HttpStatusCode.TOO_MANY_REQUESTS,
          message: 'Rate limited',
        },
      }),
    );

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.TOO_MANY_REQUESTS,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(responseClone).not.toHaveBeenCalled();
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to bad gateway when HTTPError.data is missing', async () => {
    apiClientMock.mockRejectedValueOnce(
      new MockKyHttpError(new Response(null, { status: HttpStatusCode.BAD_REQUEST })),
    );

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.BAD_GATEWAY,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to bad gateway when HTTPError.data is malformed', async () => {
    apiClientMock.mockRejectedValueOnce(
      new MockKyHttpError(new Response(null, { status: HttpStatusCode.BAD_REQUEST }), {
        unexpected: true,
      }),
    );

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.BAD_GATEWAY,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive API request failed',
      }),
    });

    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it('keeps non-HTTP ky failures mapped to service unavailable', async () => {
    apiClientMock.mockRejectedValueOnce(new TypeError('network down'));

    const { getGFileMetaList } = await import('./simplifiedAPI');

    await expect(
      getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true }),
    ).rejects.toMatchObject({
      code: HttpStatusCode.SERVICE_UNAVAILABLE,
      message: 'Google Drive request failed',
      cause: expect.objectContaining({
        message: 'Google Drive network request failed',
      }),
    });

    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });
});
