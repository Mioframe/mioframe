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

    const uploadRequest = fetchMock.mock.calls[2]?.[0];

    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Authorization')).toBe('Bearer token');
    expect(uploadRequest.headers.get('Content-Type')).toBe('text/plain');
    expect(await refreshed.text()).toBe('fresh');
  });

  it('rejects unsupported upload payloads', async () => {
    const { upload } = await import('./simplifiedAPI');
    const unsupportedChunk: WriteParams = {
      type: 'write',
      data: null,
    };

    await expect(upload({ ACCESS_TOKEN: 'token' }, 'file-id', unsupportedChunk)).rejects.toThrow(
      'Unsupported file type',
    );
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

    const uploadRequest = fetchMock.mock.calls[2]?.[0];

    expect(uploadRequest).toBeInstanceOf(Request);
    if (!(uploadRequest instanceof Request)) {
      throw new Error('Expected upload request to be a Request instance');
    }

    expect(uploadRequest.method).toBe('PATCH');
    expect(uploadRequest.headers.get('Content-Type')).toBe('image/png');
  });
});
