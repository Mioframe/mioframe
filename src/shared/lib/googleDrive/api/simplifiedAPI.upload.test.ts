import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonResponse } from './simplifiedAPI.testUtils';

vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(() => Promise.resolve({ mime: 'image/png' })),
}));

describe('simplifiedAPI upload', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

    // Verify upload request has correct Content-Type and method
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Authorization')).toBe('Bearer token');
    expect(uploadRequest.headers.get('Content-Type')).toBe('text/plain');
    expect(uploadRequest.url).toContain('uploadType=media');
    expect(uploadRequest.url).toContain('fields=id%2Cversion%2Cname');
    expect(refreshed.type).toBe('');
    expect(await refreshed.text()).toBe('fresh');
  });

  it('reuses cached downloads until clearCaches is called', async () => {
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
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['after-clear']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const first = await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    const second = await download({ ACCESS_TOKEN: 'token' }, 'file-id');

    expect(first.type).toBe('');
    expect(second.type).toBe('');
    expect(await first.text()).toBe('cached');
    expect(await second.text()).toBe('cached');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    clearCaches();

    const refreshed = await download({ ACCESS_TOKEN: 'token' }, 'file-id');

    expect(await refreshed.text()).toBe('after-clear');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('passes download auth, media query, and progress callback to the download request', async () => {
    const onDownloadProgress = vi.fn();
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
      .mockResolvedValueOnce(new Response(new Blob(['progress']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const file = await download({ ACCESS_TOKEN: 'token' }, 'file-id', { onDownloadProgress });

    expect(await file.text()).toBe('progress');

    const downloadRequest = fetchMock.mock.calls[1]?.[0];
    expect(downloadRequest).toBeInstanceOf(Request);
    if (!(downloadRequest instanceof Request)) {
      throw new Error('Expected download request to be a Request instance');
    }

    expect(downloadRequest.method).toBe('GET');
    expect(downloadRequest.headers.get('Authorization')).toBe('Bearer token');
    expect(downloadRequest.url).toContain('alt=media');
  });

  it('deduplicates concurrent downloads when no progress callback is provided', async () => {
    const downloadDeferred = Promise.resolve(new Response(new Blob(['shared']), { status: 200 }));
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
      .mockImplementationOnce(() => downloadDeferred);

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const [first, second] = await Promise.all([
      download({ ACCESS_TOKEN: 'token' }, 'file-id'),
      download({ ACCESS_TOKEN: 'token' }, 'file-id'),
    ]);

    expect(await first.text()).toBe('shared');
    expect(await second.text()).toBe('shared');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not deduplicate concurrent downloads when a progress callback is provided', async () => {
    const onDownloadProgress = vi.fn();
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
      .mockResolvedValueOnce(new Response(new Blob(['first']), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Blob(['second']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download } = await import('./simplifiedAPI');

    clearCaches();

    const [first, second] = await Promise.all([
      download({ ACCESS_TOKEN: 'token' }, 'file-id', { onDownloadProgress }),
      download({ ACCESS_TOKEN: 'token' }, 'file-id'),
    ]);

    expect(await first.text()).toBe('first');
    expect(await second.text()).toBe('second');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('deduplicates concurrent metadata reads for the same file id', async () => {
    const metadataDeferred = Promise.resolve(
      createJsonResponse({
        id: 'file-id',
        name: 'notes.txt',
        mimeType: 'text/plain',
        modifiedTime: '2024-01-01T00:00:00.000Z',
        parents: ['parent-id'],
      }),
    );
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => metadataDeferred)
      .mockResolvedValueOnce(new Response(new Blob(['fresh']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, getGDriveFileMeta } = await import('./simplifiedAPI');

    clearCaches();

    const [first, second] = await Promise.all([
      getGDriveFileMeta({ ACCESS_TOKEN: 'token' }, 'file-id'),
      getGDriveFileMeta({ ACCESS_TOKEN: 'token' }, 'file-id'),
    ]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('invalidates cached downloads after upload', async () => {
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
      .mockResolvedValueOnce(createJsonResponse({}))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-02T00:00:00.000Z', // changed time
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['fresh']), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    // Initial download (cache miss)
    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Upload changes file metadata
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', 'next content');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Download should fetch fresh data (cache invalidated)
    const refreshed = await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    expect(refreshed.type).toBe('');
    expect(await refreshed.text()).toBe('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('uploads Uint8Array content with detected MIME type', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'image.png',
          mimeType: 'image/png',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'image.png',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', pngBytes);

    // Verify upload request has correct Content-Type (detected as image/png)
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('image/png');
    expect((await uploadRequest.clone().arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('uploads ArrayBuffer content with detected MIME type', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const arrayBuffer = pngBytes.buffer.slice(
      pngBytes.byteOffset,
      pngBytes.byteOffset + pngBytes.length,
    );

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'image.png',
          mimeType: 'image/png',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'image.png',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', arrayBuffer);

    // Verify upload request has correct Content-Type (detected as image/png)
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('image/png');
  });

  it('uploads DataView content with detected MIME type', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const dataView = new DataView(pngBytes.buffer);

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'image.png',
          mimeType: 'image/png',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'image.png',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', dataView);

    // Verify upload request has correct Content-Type (detected as image/png)
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('image/png');
  });

  it('uploads Blob content preserving original type', async () => {
    const blob = new Blob(['test content'], { type: 'application/pdf' });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'document.pdf',
          mimeType: 'application/pdf',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'document.pdf',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', blob);

    // Verify upload request preserves Blob's original type
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('uploads TypedArray content with detected MIME type', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'image.png',
          mimeType: 'image/png',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'image.png',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    // TypedArray is a view of ArrayBuffer - this tests the ArrayBuffer.isView branch
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', pngBytes);

    // Verify upload request has correct Content-Type (detected as image/png)
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('image/png');
  });

  it('uploads bytes with fallback to application/octet-stream when detection fails', async () => {
    // Mock fileTypeFromBuffer to return null (no detected MIME type)
    vi.mocked(await import('file-type')).fileTypeFromBuffer = vi.fn(() =>
      Promise.resolve(undefined),
    );

    const randomBytes = new Uint8Array([1, 2, 3, 4, 5]);

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          name: 'unknown.bin',
          mimeType: 'application/octet-stream',
          modifiedTime: '2024-01-01T00:00:00.000Z',
          parents: ['parent-id'],
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob(['cached']), { status: 200 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'file-id',
          version: '1',
          name: 'unknown.bin',
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const { clearCaches, download, upload } = await import('./simplifiedAPI');

    clearCaches();

    await download({ ACCESS_TOKEN: 'token' }, 'file-id');
    await upload({ ACCESS_TOKEN: 'token' }, 'file-id', randomBytes);

    // Verify upload request uses fallback Content-Type when detection fails
    const uploadRequest = fetchMock.mock.calls[2]?.[0];
    if (uploadRequest instanceof Request) {
      expect(uploadRequest.headers.get('Content-Type')).toBe('application/octet-stream');
    }
  });
});
