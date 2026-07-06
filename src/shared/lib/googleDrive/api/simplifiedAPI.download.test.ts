import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { createJsonResponse } from './simplifiedAPI.testUtils';

/**
 * Mocks `@shared/lib/cache` with a Map-backed stand-in whose `set` throws only when writing a
 * downloaded-file cache entry (`{ file, modifiedTime }`), leaving the metadata/list caches the
 * module also uses fully functional.
 */
const mockCacheWithThrowingContentWrite = () => {
  vi.doMock('@shared/lib/cache', () => ({
    Cache: class {
      #map = new Map<string, unknown>();

      set(k: unknown, v: unknown) {
        if (v !== null && typeof v === 'object' && 'file' in v) {
          throw new Error('cache write failed');
        }
        this.#map.set(typeof k === 'string' ? k : JSON.stringify(k), v);
      }

      get(k: unknown) {
        return this.#map.get(typeof k === 'string' ? k : JSON.stringify(k));
      }

      delete(k: unknown) {
        return this.#map.delete(typeof k === 'string' ? k : JSON.stringify(k));
      }

      clear() {
        this.#map.clear();
      }
    },
  }));
};

describe('simplifiedAPI download', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.doUnmock('@shared/lib/cache');
  });

  it('returns a zero-byte File for an empty media body without throwing', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'empty.mf',
          mimeType: 'application/octet-stream',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob([]), { status: HttpStatusCode.OK }));
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const file = await download({ ACCESS_TOKEN: 'token' }, 'gd-123');

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(0);
  });

  it('returns the downloaded zero-byte file even when caching it throws', async () => {
    mockCacheWithThrowingContentWrite();

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'empty.mf',
          mimeType: 'application/octet-stream',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(new Response(new Blob([]), { status: HttpStatusCode.OK }));
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const file = await download({ ACCESS_TOKEN: 'token' }, 'gd-123');

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(0);
  });

  it('returns the downloaded file even when caching it throws (non-empty file)', async () => {
    mockCacheWithThrowingContentWrite();

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(new Response('hello', { status: HttpStatusCode.OK }));
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const file = await download({ ACCESS_TOKEN: 'token' }, 'gd-123');

    expect(file).toBeInstanceOf(File);
    expect(file.size).toBeGreaterThan(0);
  });

  it('still fails the download when the real metadata request fails', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: HttpStatusCode.NOT_FOUND, message: 'File not found' } }),
        {
          status: HttpStatusCode.NOT_FOUND,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    await expect(download({ ACCESS_TOKEN: 'token' }, 'gd-123')).rejects.toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.NOT_FOUND,
    });
  });

  it('still fails the download when the real media request fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: HttpStatusCode.FORBIDDEN, message: 'Permission denied' },
          }),
          {
            status: HttpStatusCode.FORBIDDEN,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    await expect(download({ ACCESS_TOKEN: 'token' }, 'gd-123')).rejects.toMatchObject({
      name: 'GoogleDriveError',
      code: HttpStatusCode.FORBIDDEN,
    });
  });
});
