import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { SPACE } from './types';
import { createFolderMimeType, createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI create', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('rejects create requests with an empty parents array', async () => {
    const { create } = await import('./simplifiedAPI');

    await expect(
      create(
        {
          ACCESS_TOKEN: 'token',
        },
        {
          name: 'orphan-folder',
          parents: [],
          mimeType: createFolderMimeType,
        },
      ),
    ).rejects.toMatchObject({
      code: HttpStatusCode.FORBIDDEN,
    });
  });

  it('creates a file with valid parents and invalidates cache', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-file-id' }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const result = await create(auth, {
      name: 'new-folder',
      parents: ['parent-id'],
      mimeType: createFolderMimeType,
    });

    expect(result.result.id).toBe('new-file-id');
  });
});
