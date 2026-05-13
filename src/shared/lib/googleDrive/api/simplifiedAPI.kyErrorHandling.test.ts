import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';

const { apiClientMock, MockKyHttpError } = vi.hoisted(() => {
  class HoistedMockKyHttpError extends Error {
    response: Response;

    constructor(response: Response) {
      super('Mock HTTPError');
      this.response = response;
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
});
