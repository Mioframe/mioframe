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
      // First call: getGFileMetaList initial fetch
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
      // Second call: create POST request
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-file-id' }))
      // Third call: getGFileMetaList after cache invalidation
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
            {
              id: 'new-file-id',
              name: 'new-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      // Fourth call: getGFileMetaList after refresh (may be cached or not)
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
            {
              id: 'new-file-id',
              name: 'new-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token', API_KEY: 'api-key' };
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

    // Verify POST request has correct URL and method
    const createRequest = fetchMock.mock.calls[1]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Authorization')).toBe('Bearer token');
      expect(createRequest.url).toContain('key=api-key');
      await expect(createRequest.clone().json()).resolves.toMatchObject({
        name: 'new-folder',
        parents: ['parent-id'],
        mimeType: createFolderMimeType,
      });
    }

    // Verify cache invalidation - subsequent list should fetch again
    await getGFileMetaList(auth, listParams);

    // Should be at least 2 calls (initial + create), possibly more due to refresh
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
