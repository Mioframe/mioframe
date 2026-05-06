import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPACE } from './types';
import {
  createDeferred,
  createFolderMimeType,
  createJsonResponse,
} from './simplifiedAPI.testUtils';

describe('simplifiedAPI list cache invalidation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('invalidates a cached non-empty parent directory list after create', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-folder',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-folder-id' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-folder',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
            {
              id: 'new-folder-id',
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

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const listParams = {
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    const firstResult = await getGFileMetaList(auth, listParams);
    const cachedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual(firstResult);

    await create(auth, {
      name: 'new-folder',
      parents: ['parent-id'],
      mimeType: createFolderMimeType,
    });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({
        id: 'existing-folder',
      }),
      expect.objectContaining({
        id: 'new-folder-id',
      }),
    ]);
  });

  it('does not cache empty App Data directory lists before create', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({ files: [] }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-folder-id' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'new-folder-id',
              name: 'new-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['appDataFolder'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const listParams = {
      q: {
        parentId: 'appDataFolder',
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      fetchAll: true,
    };

    const firstResult = await getGFileMetaList(auth, listParams);
    const cachedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual(firstResult);
    expect(cachedResult.files).toEqual([]);

    await create(auth, {
      name: 'new-folder',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({
        id: 'new-folder-id',
        name: 'new-folder',
      }),
    ]);
  });

  it('invalidates a cached App Data root list even when child parents use a real folder id', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-folder',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-folder-id' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-folder',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'new-folder-id',
              name: 'new-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const listParams = {
      q: {
        parentId: 'appDataFolder',
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      fetchAll: true,
    };

    const firstResult = await getGFileMetaList(auth, listParams);
    const cachedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cachedResult).toEqual(firstResult);

    await create(auth, {
      name: 'new-folder',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({
        id: 'existing-folder',
      }),
      expect.objectContaining({
        id: 'new-folder-id',
      }),
    ]);
  });

  it('clears a stale App Data root list that finishes while create is still in flight', async () => {
    const staleListResponse = createDeferred<Response>();
    const createResponse = createDeferred<Response>();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => staleListResponse.promise)
      .mockImplementationOnce(() => createResponse.promise)
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-folder',
              name: 'existing-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'new-folder-id',
              name: 'new-folder',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const listParams = {
      q: {
        parentId: 'appDataFolder',
        sharedWithMe: false,
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1000,
      fetchAll: true,
    };

    const staleReadPromise = getGFileMetaList(auth, listParams);
    const createPromise = create(auth, {
      name: 'new-folder',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    staleListResponse.resolve(
      createJsonResponse({
        files: [
          {
            id: 'existing-folder',
            name: 'existing-folder',
            mimeType: createFolderMimeType,
            modifiedTime: '2024-01-01T00:00:00.000Z',
            parents: ['real-app-data-root-id'],
          },
        ],
      }),
    );

    await expect(staleReadPromise).resolves.toEqual({
      files: [
        expect.objectContaining({
          id: 'existing-folder',
        }),
      ],
    });

    createResponse.resolve(createJsonResponse({ id: 'new-folder-id' }));
    await createPromise;

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({
        id: 'existing-folder',
      }),
      expect.objectContaining({
        id: 'new-folder-id',
      }),
    ]);
  });

  it('invalidates the App Data root list even when several name-specific list entries exist', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-folder-id' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'new-folder-id',
              name: 'folder-c',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const rootListParams = {
      q: {
        parentId: 'appDataFolder',
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1000,
      fetchAll: true,
    };
    const folderAListParams = {
      q: {
        parentId: 'appDataFolder',
        name: 'folder-a',
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1,
      fetchAll: true,
    };
    const folderBListParams = {
      q: {
        parentId: 'appDataFolder',
        name: 'folder-b',
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1,
      fetchAll: true,
    };

    await getGFileMetaList(auth, rootListParams);
    await getGFileMetaList(auth, folderAListParams);
    await getGFileMetaList(auth, folderBListParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    await create(auth, {
      name: 'folder-c',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    const refreshedRootResult = await getGFileMetaList(auth, rootListParams);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(refreshedRootResult.files).toEqual([
      expect.objectContaining({ id: 'folder-a-id' }),
      expect.objectContaining({ id: 'folder-b-id' }),
      expect.objectContaining({ id: 'new-folder-id' }),
    ]);
  });

  it('invalidates the App Data root list after concurrent duplicate root reads', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-c-id',
              name: 'folder-c',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ id: 'new-folder-id' }))
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'folder-a-id',
              name: 'folder-a',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-b-id',
              name: 'folder-b',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'folder-c-id',
              name: 'folder-c',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'new-folder-id',
              name: 'folder-d',
              mimeType: createFolderMimeType,
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, create, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = {
      ACCESS_TOKEN: 'token',
    };
    const rootListParams = {
      q: {
        parentId: 'appDataFolder',
        sharedWithMe: false,
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1000,
      fetchAll: true,
    };
    const folderAListParams = {
      q: {
        parentId: 'appDataFolder',
        name: 'folder-a',
        sharedWithMe: false,
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1,
      fetchAll: true,
    };
    const folderBListParams = {
      q: {
        parentId: 'appDataFolder',
        name: 'folder-b',
        sharedWithMe: false,
        trashed: false,
      },
      spaces: [SPACE.appDataFolder],
      pageSize: 1,
      fetchAll: true,
    };

    await Promise.all([
      getGFileMetaList(auth, rootListParams),
      getGFileMetaList(auth, rootListParams),
      getGFileMetaList(auth, rootListParams),
    ]);
    await getGFileMetaList(auth, folderAListParams);
    await getGFileMetaList(auth, folderBListParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    await create(auth, {
      name: 'folder-d',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    const refreshedRootResult = await getGFileMetaList(auth, rootListParams);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(refreshedRootResult.files).toEqual([
      expect.objectContaining({ id: 'folder-a-id' }),
      expect.objectContaining({ id: 'folder-b-id' }),
      expect.objectContaining({ id: 'folder-c-id' }),
      expect.objectContaining({ id: 'new-folder-id' }),
    ]);
  });
});

describe('simplifiedAPI createWithContent cache behavior', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not invalidate metadata of sibling files after createWithContent', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // 1. getGDriveFileMeta for sibling (caches metadata)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'sibling-file-id',
          name: 'sibling.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      // 2. createWithContent POST request (multipart)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-with-content-id',
          name: 'test.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGDriveFileMeta } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };

    // Cache sibling metadata
    const cachedSibling = await getGDriveFileMeta(auth, 'sibling-file-id');
    expect(cachedSibling).toMatchObject({
      id: 'sibling-file-id',
      name: 'sibling.txt',
      mimeType: 'text/plain',
    });

    // Create a blob for file content
    const fileBlob = new Blob(['test content'], { type: 'text/plain' });

    await createWithContent(
      auth,
      { name: 'test.txt', parents: ['parent-id'], mimeType: 'text/plain' },
      fileBlob,
    );

    // Re-fetch sibling metadata — should come from cache (no new network request)
    const freshSibling = await getGDriveFileMeta(auth, 'sibling-file-id');
    expect(freshSibling).toMatchObject({
      id: 'sibling-file-id',
      name: 'sibling.txt',
    });

    // Total fetch count should be exactly 2 (initial sibling + createWithContent)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('still invalidates parent list-cache after createWithContent', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // 1. getGFileMetaList initial fetch
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'folder.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      // 2. createWithContent POST request (multipart)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-with-content-id',
          name: 'test.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      // 3. getGFileMetaList after cache invalidation
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'folder.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
            {
              id: 'new-file-with-content-id',
              name: 'test.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const listParams = {
      q: { parentId: 'parent-id', trashed: false },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Create a blob for file content
    const fileBlob = new Blob(['test content'], { type: 'text/plain' });

    await createWithContent(
      auth,
      { name: 'test.txt', parents: ['parent-id'], mimeType: 'text/plain' },
      fileBlob,
    );

    // Verify cache invalidation - subsequent list should fetch again
    await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('simplifiedAPI upload cache behavior', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('upload clears file metadata cache through the public API', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // First call: getGDriveFileMeta initial fetch (caches metadata)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'existing.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      // Second call: upload request
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      // Third call: getGDriveFileMeta after invalidation (should fetch again)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'updated.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGDriveFileMeta, upload } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };

    // First call caches the metadata
    const firstResult = await getGDriveFileMeta(auth, 'file-id');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult.name).toBe('existing.txt');

    await upload(auth, 'file-id', 'next content');

    // Next call should make a new network request (cache was invalidated)
    const secondResult = await getGDriveFileMeta(auth, 'file-id');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(secondResult.name).toBe('updated.txt');
  });
});
