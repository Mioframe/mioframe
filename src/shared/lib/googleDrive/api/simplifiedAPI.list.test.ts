import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPACE } from './types';
import { createFolderMimeType, createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI list', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('caches individual file metadata from list results for getGDriveFileMeta', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        files: [
          {
            id: 'file-a-id',
            name: 'file-a.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['parent-id'],
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList, getGDriveFileMeta } = await import('./simplifiedAPI');

    clearCaches();

    const listResult = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      {
        q: {
          parentId: 'parent-id',
          trashed: false,
        },
        spaces: [SPACE.drive],
        fetchAll: true,
      },
    );

    expect(listResult.files).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const singleMeta = await getGDriveFileMeta({ ACCESS_TOKEN: 'token' }, 'file-a-id');

    expect(singleMeta.id).toBe('file-a-id');
    expect(singleMeta.name).toBe('file-a.txt');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches only a single page when fetchAll is false', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        files: [
          {
            id: 'folder-a-id',
            name: 'folder-a',
            mimeType: createFolderMimeType,
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['parent-id'],
          },
        ],
        nextPageToken: 'next-page',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const result = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      {
        q: {
          parentId: 'parent-id',
          trashed: false,
        },
        spaces: [SPACE.drive],
        pageToken: 'current-page',
        pageSize: 25,
        fetchAll: false,
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      files: [expect.objectContaining({ id: 'folder-a-id' })],
      nextPageToken: 'next-page',
    });
  });
});
