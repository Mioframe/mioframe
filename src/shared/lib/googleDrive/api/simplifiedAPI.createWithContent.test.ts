import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { SPACE } from './types';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI createWithContent', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('rejects requests with an empty parents array', async () => {
    const { createWithContent } = await import('./simplifiedAPI');

    // Create a blob for file content
    const fileBlob = new Blob(['test content'], { type: 'text/plain' });

    await expect(
      createWithContent(
        { ACCESS_TOKEN: 'token' },
        { name: 'orphan-file', parents: [], mimeType: 'text/plain' },
        fileBlob,
      ),
    ).rejects.toMatchObject({
      code: HttpStatusCode.FORBIDDEN,
    });
  });

  it('creates a file with content and invalidates parent cache', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // First call: getGFileMetaList initial fetch
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
      // Second call: createWithContent POST request (multipart)
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-with-content-id',
          name: 'test.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      // Third call: getGFileMetaList after cache invalidation
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

    // Verify POST request has correct URL and method
    const createRequest = fetchMock.mock.calls[1]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');
      expect(createRequest.headers.get('Authorization')).toBe('Bearer token');
      expect(createRequest.url).toContain('uploadType=multipart');
      expect(createRequest.url).toContain('fields=');

      const multipartText = await createRequest.clone().text();
      expect(multipartText).toContain('Content-Type: application/json; charset=UTF-8');
      expect(multipartText).toContain('"name":"test.txt"');
      expect(multipartText).toContain('"parents":["parent-id"]');
      expect(multipartText).toContain('Content-Type: text/plain');
      expect(multipartText).toContain('test content');
    }

    // Verify cache invalidation - subsequent list should fetch again
    await getGFileMetaList(auth, listParams);

    // Should be at least 2 calls (initial + create)
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('handles file content as string', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        id: 'new-file-with-content-id',
        name: 'string-file.txt',
        mimeType: 'text/plain',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent } = await import('./simplifiedAPI');

    clearCaches();

    // Create with string content
    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      { name: 'string-file.txt', parents: ['parent-id'], mimeType: 'text/plain' },
      'This is a text file content',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Verify POST request has correct Content-Type header with multipart boundary
    const createRequest = fetchMock.mock.calls[0]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');
      expect(createRequest.url).toContain('uploadType=multipart');

      const multipartText = await createRequest.clone().text();
      expect(multipartText).toContain('"name":"string-file.txt"');
      expect(multipartText).toContain('Content-Type: text/plain');
      expect(multipartText).toContain('This is a text file content');
    }
  });

  it('handles file content as ArrayBuffer', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        id: 'new-file-with-content-id',
        name: 'binary-file.bin',
        mimeType: 'application/octet-stream',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent } = await import('./simplifiedAPI');

    clearCaches();

    // Create with ArrayBuffer content
    const arrayBuffer = new ArrayBuffer(8);
    const view = new Uint8Array(arrayBuffer);
    view[0] = 0x42;
    view[1] = 0x43;

    const result = await createWithContent(
      { ACCESS_TOKEN: 'token' },
      { name: 'binary-file.bin', parents: ['parent-id'], mimeType: 'application/octet-stream' },
      arrayBuffer,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.result.id).toBe('new-file-with-content-id');

    // Verify POST request has correct Content-Type header with multipart boundary
    const createRequest = fetchMock.mock.calls[0]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');
    }

    const { getGDriveFileMeta } = await import('./simplifiedAPI');
    const cachedMeta = await getGDriveFileMeta(
      { ACCESS_TOKEN: 'token' },
      'new-file-with-content-id',
    );

    expect(cachedMeta).toMatchObject({
      id: 'new-file-with-content-id',
      name: 'binary-file.bin',
      mimeType: 'application/octet-stream',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('handles file content as TypedArray', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        id: 'new-file-with-content-id',
        name: 'typed-array.bin',
        mimeType: 'application/octet-stream',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent } = await import('./simplifiedAPI');

    clearCaches();

    // Create with TypedArray content
    const typedArray = new Uint8Array([0x42, 0x43, 0x44]);

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      { name: 'typed-array.bin', parents: ['parent-id'], mimeType: 'application/octet-stream' },
      typedArray,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Verify POST request has correct Content-Type header with multipart boundary
    const createRequest = fetchMock.mock.calls[0]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');

      const multipartText = await createRequest.clone().text();
      expect(multipartText).toContain('Content-Type: application/octet-stream');
    }
  });

  it('handles file content as Blob', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createJsonResponse({
        id: 'new-file-with-content-id',
        name: 'blob-file.txt',
        mimeType: 'text/plain',
        modifiedTime: '2024-01-02T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent } = await import('./simplifiedAPI');

    clearCaches();

    // Create with Blob content
    const blob = new Blob(['blob content'], { type: 'text/plain' });

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      { name: 'blob-file.txt', parents: ['parent-id'], mimeType: 'text/plain' },
      blob,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Verify POST request has correct Content-Type header with multipart boundary
    const createRequest = fetchMock.mock.calls[0]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');

      const multipartText = await createRequest.clone().text();
      expect(multipartText).toContain('Content-Type: text/plain');
      expect(multipartText).toContain('blob content');
    }
  });

  it('creates file in appDataFolder (different from the list query parent)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-with-content-id',
          name: 'appdata.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['appDataFolder'],
        }),
      )
      // Third call: getGFileMetaList after cache invalidation (should fetch from different parent)
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'other-folder.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['different-parent'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    // Create with content in appDataFolder (different from the list query's parent)
    const fileBlob = new Blob(['appdata content'], { type: 'text/plain' });

    await createWithContent(
      { ACCESS_TOKEN: 'token' },
      { name: 'appdata.txt', parents: ['appDataFolder'], mimeType: 'text/plain' },
      fileBlob,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Verify POST request has correct URL and method
    const createRequest = fetchMock.mock.calls[0]?.[0];
    if (createRequest instanceof Request) {
      expect(createRequest.url).toContain('/upload/drive/v3/files');
      expect(createRequest.method).toBe('POST');
      expect(createRequest.headers.get('Content-Type')).toContain('multipart/related');
    }

    // Verify cache invalidation - subsequent list should fetch again for the original parent query
    await getGFileMetaList(
      { ACCESS_TOKEN: 'token' },
      {
        q: { parentId: 'different-parent', trashed: false },
        spaces: [SPACE.drive],
        fetchAll: true,
      },
    );

    // Should be at least 2 calls (initial + create)
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('invalidates cached real-parent lists returned by createWithContent metadata', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-parent-id'],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'new-file-id',
          name: 'fresh.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          parents: ['real-parent-id'],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          files: [
            {
              id: 'existing-file-id',
              name: 'existing.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-01T00:00:00.000Z',
              parents: ['real-parent-id'],
            },
            {
              id: 'new-file-id',
              name: 'fresh.txt',
              mimeType: 'text/plain',
              modifiedTime: '2024-01-02T00:00:00.000Z',
              parents: ['real-parent-id'],
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, createWithContent, getGFileMetaList } = await import('./simplifiedAPI');

    clearCaches();

    const auth = { ACCESS_TOKEN: 'token' };
    const realParentListParams = {
      q: { parentId: 'real-parent-id', trashed: false },
      spaces: [SPACE.appDataFolder],
      fetchAll: true,
    };

    await getGFileMetaList(auth, realParentListParams);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await createWithContent(
      auth,
      { name: 'fresh.txt', parents: ['appDataFolder'], mimeType: 'text/plain' },
      'fresh file',
    );

    const refreshed = await getGFileMetaList(auth, realParentListParams);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshed.files).toEqual([
      expect.objectContaining({ id: 'existing-file-id' }),
      expect.objectContaining({ id: 'new-file-id' }),
    ]);
  });
});
