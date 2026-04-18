import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { SPACE } from './types';

const createFolderMimeType = 'application/vnd.google-apps.folder';

const createJsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('simplifiedAPI cache invalidation', () => {
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

    await getGFileMetaList(auth, listParams);
    await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await create(auth, {
      name: 'new-folder',
      parents: ['appDataFolder'],
      mimeType: createFolderMimeType,
    });

    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(4);
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

  it('reuses the cached file download when metadata has not changed', async () => {
    const mediaBlob = new Blob(['cached-content'], { type: 'text/plain' });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(mediaBlob, { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const firstFile = await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    const secondFile = await download({ ACCESS_TOKEN: 'token' }, 'file-id');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await firstFile.text()).toBe('cached-content');
    expect(secondFile).toBe(firstFile);
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

  it('uploads string content as text/plain and invalidates cached downloads', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['fresh']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', 'next content');
    const refreshed = await download({ ACCESS_TOKEN: 'token' }, 'file-id');

    const uploadRequest = fetchMock.mock.calls[2]?.[0] as Request;

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Authorization')).toBe('Bearer token');
    expect(uploadRequest.headers.get('Content-Type')).toBe('text/plain');
    expect(await refreshed.text()).toBe('fresh');
  });

  it('rejects unsupported upload payloads', async () => {
    const { upload } = await import('./simplifiedAPI');

    await expect(
      upload({ ACCESS_TOKEN: 'token' }, 'file-id', {
        invalid: true,
      } as unknown as FileSystemWriteChunkType),
    ).rejects.toThrow('Unsupported file type');
  });
});
