import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { SPACE } from './types';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI error handling', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes non-ok JSON responses into GoogleDriveError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            code: HttpStatusCode.FORBIDDEN,
            message: 'Forbidden',
          },
        },
        HttpStatusCode.FORBIDDEN,
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    await expect(
      getGFileMetaList(
        { ACCESS_TOKEN: 'token' },
        {
          q: {
            parentId: 'parent-id',
            trashed: false,
          },
          spaces: [SPACE.drive],
          fetchAll: true,
        },
      ),
    ).rejects.toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.FORBIDDEN,
      message: 'Forbidden',
    });
  });
});
