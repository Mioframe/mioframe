import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPACE } from './types';
import { createJsonResponse } from './simplifiedAPI.testUtils';

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
            id: 'file-id',
            name: 'test.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['parent-id'],
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGDriveFileMeta, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    // First call - list files (which caches individual file metadata)
    const listResult = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    );

    expect(listResult.files?.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call - should use cached metadata instead of fetching again
    const fileMeta = await getGDriveFileMeta({ ACCESS_TOKEN: 'token' }, 'file-id');

    expect(fileMeta.id).toBe('file-id');
    expect(fileMeta.name).toBe('test.txt');
    expect(fetchMock).toHaveBeenCalledTimes(1); // Still just 1 call - metadata was cached from list
  });

  it('fetches file metadata with correct query parameters for single page fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        files: [
          {
            id: 'folder-a-id',
            name: 'Folder A',
            mimeType: 'application/vnd.google-apps.folder',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: [],
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
    expect(result.files?.length).toBe(1);
    expect(result.nextPageToken).toBe('next-page');

    // Verify query params are correctly built with trashed=false and spaces=drive for single page fetch
    const request = fetchMock.mock.calls[0]?.[0];
    if (request instanceof Request) {
      expect(request.url).toContain('trashed+%3D+false');
      expect(request.url).toContain('spaces=drive');
      expect(request.url).toContain('pageSize=25');
      expect(request.url).toContain('pageToken=current-page');
    }
  });

  it('fetches all pages when fetchAll is true', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'Folder A',
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: [],
            },
          ],
          nextPageToken: 'next-page-token',
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-b-id',
              name: 'Folder B',
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: [],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const result = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], pageSize: 10, fetchAll: true },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.files?.length).toBe(2);
    expect(result.nextPageToken).toBeUndefined();
  });

  it('handles empty spaces array by passing empty string', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        files: [
          {
            id: 'file-id',
            name: 'test.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: [],
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    // Verify that empty spaces array results in empty string value
    const result = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    );

    expect(result.files?.length).toBe(1);

    // Verify query params - spaces should be an empty string when array is empty
    const request = fetchMock.mock.calls[0]?.[0];
    if (request instanceof Request) {
      expect(request.url).toContain('spaces=');
    }
  });

  it('uses default pagination parameters when they are omitted', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-id',
              name: 'defaulted.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: [],
            },
          ],
          nextPageToken: 'next-page',
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'file-2',
              name: 'defaulted-2.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: [],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const result = await getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {} });

    const request = fetchMock.mock.calls[0]?.[0];
    if (request instanceof Request) {
      expect(request.url).toContain('pageSize=1000');
      expect(request.url).toContain('pageToken=');
      expect(request.url).toContain('spaces=');
      expect(request.url).not.toContain('Stryker+was+here');
    }
    expect(result.files).toHaveLength(2);
    expect(result.nextPageToken).toBeUndefined();
  });

  it('returns an empty list when the API response omits files', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(createJsonResponse({}));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const result = await getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, fetchAll: true });

    expect(result).toEqual({
      files: [],
      nextPageToken: undefined,
    });
  });

  it('preserves a single-page response without files when fetchAll is false', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        nextPageToken: 'next-page',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const result = await getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, fetchAll: false });

    expect(result.files).toBeUndefined();
    expect(result.nextPageToken).toBe('next-page');
  });

  it('caches list results for identical queries', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        files: [
          {
            id: 'file-id',
            name: 'test.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: [],
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    // First call - should fetch from API
    await getGFileMetaList({ ACCESS_TOKEN: 'token' }, { q: {}, spaces: [], fetchAll: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call with identical params - should use cache
    const result = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: {}, spaces: [], fetchAll: true },
    );

    expect(result.files?.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Still just 1 call - used cached list
  });

  it('fetches file metadata without trashed parameter when not specified', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        files: [
          {
            id: 'file-id',
            name: 'test.txt',
            mimeType: 'text/plain',
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: [],
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    // Query without trashed field should not include it in searchParams
    const result = await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      { q: { name: 'test.txt' }, spaces: [SPACE.drive], fetchAll: true },
    );

    expect(result.files?.length).toBe(1);

    // Verify query params - trashed should NOT be in the request when not specified
    const request = fetchMock.mock.calls[0]?.[0];
    if (request instanceof Request) {
      expect(request.url).not.toContain('trashed%3D');
    }
  });
});
