import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { SPACE } from './types';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('createWithContent', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends multipart request with metadata and content', async () => {
    let requestBody = '';
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (!(input instanceof Request)) {
        throw new Error('Expected fetch to receive a Request');
      }
      requestBody = await input.clone().text();

      return createJsonResponse({
        id: 'file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
        size: '7',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { createWithContent } = await import('./simplifiedAPI');

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      {
        name: 'notes.txt',
        parents: ['parent-id'],
      },
      'content',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request] = fetchMock.mock.calls[0] ?? [];

    expect(request instanceof Request).toBe(true);
    if (!(request instanceof Request)) {
      throw new Error('Expected fetch to receive a Request');
    }
    expect(request.url).toContain(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    );
    expect(request.method).toBe('POST');
    expect(request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.headers.get('Content-Type')).toContain('multipart/related; boundary=');

    // Content-Length should not be set manually (browser controls this)
    expect(request.headers.has('Content-Length')).toBe(false);

    expect(requestBody).toContain('Content-Type: application/json; charset=UTF-8');
    expect(requestBody).toContain(JSON.stringify({ name: 'notes.txt', parents: ['parent-id'] }));
    expect(requestBody).toContain('Content-Type: text/plain');
    expect(requestBody).toContain('content');
  });

  it('uses fieldsGDriveFileMeta in multipart request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        id: 'file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
        modifiedTime: '2024-01-02T00:00:00.000Z',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { createWithContent } = await import('./simplifiedAPI');
    const { fieldsGDriveFileMeta } = await import('./types');

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      {
        name: 'notes.txt',
        parents: ['parent-id'],
      },
      new Blob(['content'], { type: 'text/plain' }),
    );

    const [request] = fetchMock.mock.calls[0] ?? [];

    expect(request instanceof Request).toBe(true);
    if (!(request instanceof Request)) {
      throw new Error('Expected fetch to receive a Request');
    }
    const requestUrl = new URL(request.url);

    expect(requestUrl.searchParams.get('fields')).toBe(fieldsGDriveFileMeta);
  });

  it('caches created file metadata in gFileMetaCache', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        id: 'new-file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
        size: '7',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGDriveFileMeta } = await import('./simplifiedAPI');

    clearCaches();

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      {
        name: 'notes.txt',
        parents: ['parent-id'],
      },
      'content',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const metadata = await getGDriveFileMeta({ ACCESS_TOKEN: 'token' }, 'new-file-id');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(metadata).toEqual(
      expect.objectContaining({
        id: 'new-file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
      }),
    );
  });

  it('invalidates parent list-cache after createWithContent', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          size: '7',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
            {
              id: 'new-file-id',
              name: 'notes.txt',
              mimeType: 'text/plain',
              size: '7',
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
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    await createWithContent(
      auth,
      {
        name: 'notes.txt',
        parents: ['parent-id'],
      },
      'content',
    );
    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({ id: 'existing-file' }),
      expect.objectContaining({ id: 'new-file-id' }),
    ]);
  });

  it('negative cache does not hide created file after parent cache invalidation', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({ files: [] }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          size: '7',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'new-file-id',
              name: 'notes.txt',
              mimeType: 'text/plain',
              size: '7',
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
      q: {
        parentId: 'parent-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    await getGFileMetaList(auth, listParams);
    await createWithContent(
      auth,
      {
        name: 'notes.txt',
        parents: ['parent-id'],
      },
      'content',
    );
    const refreshedResult = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({
        id: 'new-file-id',
        name: 'notes.txt',
      }),
    ]);
  });

  it('does not cache error responses', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            error: {
              code: HttpStatusCode.NOT_FOUND,
              message: 'File not found',
            },
          },
          HttpStatusCode.NOT_FOUND,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['parent-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGFileMetaList } = await import('./simplifiedAPI');

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

    await expect(getGFileMetaList(auth, listParams)).rejects.toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.NOT_FOUND,
    });

    const result = await getGFileMetaList(auth, listParams);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.files).toEqual([expect.objectContaining({ id: 'existing-file' })]);
  });

  it('invalidates cache by both resource.parents and result.parents when they differ', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          size: '7',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['real-app-data-root-id'],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
            {
              id: 'new-file-id',
              name: 'notes.txt',
              mimeType: 'text/plain',
              size: '7',
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-app-data-root-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const realParentListParams = {
      q: {
        parentId: 'real-app-data-root-id',
        trashed: false,
      },
      spaces: [SPACE.drive],
      fetchAll: true,
    };

    const firstResult = await getGFileMetaList(auth, realParentListParams);
    expect(firstResult.files).toEqual([expect.objectContaining({ id: 'existing-file' })]);

    await createWithContent(auth, { name: 'notes.txt', parents: ['appDataFolder'] }, 'content');

    const refreshedResult = await getGFileMetaList(auth, realParentListParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshedResult.files).toEqual([
      expect.objectContaining({ id: 'existing-file' }),
      expect.objectContaining({ id: 'new-file-id' }),
    ]);
  });
});
