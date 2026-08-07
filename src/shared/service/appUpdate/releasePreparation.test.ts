import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import type { ReleaseDescriptor } from './contracts';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';
import { buildReleaseCacheName, readReleaseDescriptorMarker } from './releaseCache';

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();
const digestMock = vi.fn();

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('crypto', { subtle: { digest: digestMock } });

const BASE_PATH = '/';
const CHANNEL = 'stable';
const RELEASE_NUMBER = 1;
const FILE_SHA256 = '0'.repeat(64);

const ARCHIVED_INDEX_HTML = '<html>archived</html>';

const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: RELEASE_NUMBER,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexSha256: FILE_SHA256,
  indexByteSize: ARCHIVED_INDEX_HTML.length,
  files: [{ path: 'assets/app.js', sha256: FILE_SHA256, byteSize: 3 }],
};

/** Digest mock returning bytes that hash to `FILE_SHA256` (all-zero bytes). */
function mockDigestMatchesFileHash(): void {
  digestMock.mockResolvedValue(new Uint8Array(32).buffer);
}

function mockSuccessfulDownloads(): void {
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith('index.html')) return new Response(ARCHIVED_INDEX_HTML);
    return new Response('AAA');
  });
}

describe('fetchLatestReleasePointer', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('fetches and validates the pointer', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ releaseNumber: RELEASE_NUMBER })));
    const { fetchLatestReleasePointer } = await import('./releasePreparation');

    expect(await fetchLatestReleasePointer(BASE_PATH)).toEqual({ releaseNumber: RELEASE_NUMBER });
  });

  it('rejects a structurally invalid pointer', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ releaseNumber: 0 })));
    const { fetchLatestReleasePointer } = await import('./releasePreparation');

    await expect(fetchLatestReleasePointer(BASE_PATH)).rejects.toThrow('structurally invalid');
  });

  it('rejects when the fetch itself fails', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const { fetchLatestReleasePointer } = await import('./releasePreparation');

    await expect(fetchLatestReleasePointer(BASE_PATH)).rejects.toThrow(
      'Failed to fetch latest.json',
    );
  });
});

describe('fetchReleaseDescriptor', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('fetches and validates the descriptor when it matches the expected release', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(descriptor)));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    const result = await fetchReleaseDescriptor(BASE_PATH, { releaseNumber: RELEASE_NUMBER });

    expect(result).toEqual(descriptor);
  });

  it('rejects a descriptor whose identity does not match the expected release', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...descriptor, releaseNumber: 2 })));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(
      fetchReleaseDescriptor(BASE_PATH, { releaseNumber: RELEASE_NUMBER }),
    ).rejects.toThrow('identity does not match');
  });

  it('rejects a structurally invalid descriptor', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ not: 'a descriptor' })));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(
      fetchReleaseDescriptor(BASE_PATH, { releaseNumber: RELEASE_NUMBER }),
    ).rejects.toThrow('structurally invalid');
  });

  it('rejects when the fetch itself fails', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(
      fetchReleaseDescriptor(BASE_PATH, { releaseNumber: RELEASE_NUMBER }),
    ).rejects.toThrow('Failed to fetch release descriptor');
  });
});

describe('prepareRelease', () => {
  beforeEach(() => {
    cachesByName.clear();
    fetchMock.mockReset();
    digestMock.mockReset();
    mockDigestMatchesFileHash();
  });

  it('downloads, validates, and commits every file into one release cache, writing the descriptor marker last', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    const cache = await fakeCaches.open(cacheName);
    const marker = await readReleaseDescriptorMarker(cache);
    expect(marker).toEqual(descriptor);
    const asset = await cache.match(`${BASE_PATH}assets/app.js`);
    expect(await asset?.text()).toBe('AAA');
  });

  it('fetches the archived index from a path derived from the release number, not a stored URL', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_PATH}updates/releases/${RELEASE_NUMBER}/index.html`,
      expect.anything(),
    );
  });

  it('is a no-op when the release is already fully committed and available — never rebuilds a valid cache', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    fetchMock.mockClear();

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes the release cache on any failure, leaving no partial content behind, without copying the raw runtime error into the safe message', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { prepareRelease } = await import('./releasePreparation');

    const error: unknown = await prepareRelease(BASE_PATH, CHANNEL, descriptor).catch(
      (caught: unknown) => caught,
    );

    if (!(error instanceof DomainError)) throw new Error('Expected a DomainError');
    expect(error.message).toBe('Failed to download release file');
    if (!(error.cause instanceof Error)) throw new Error('Expected an Error cause');
    expect(error.cause.message).toBe('network down');

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a byte-size mismatch and deletes the cache, without leaving anything committed', async () => {
    fetchMock.mockResolvedValue(new Response('too-long-a-body'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Byte size mismatch',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a SHA-256 mismatch and deletes the cache, without leaving anything committed', async () => {
    fetchMock.mockResolvedValue(new Response('AAA'));
    digestMock.mockResolvedValue(new Uint8Array(32).fill(1).buffer);
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'SHA-256 mismatch',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a truncated archived index (byte-size mismatch) and deletes the cache', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('index.html')) return new Response(ARCHIVED_INDEX_HTML.slice(0, -1));
      return new Response('AAA');
    });
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Byte size mismatch for archived index',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a modified archived index with a matching byte size but a wrong hash, and deletes the cache', async () => {
    mockSuccessfulDownloads();
    // First digest call hashes the one release file (matches FILE_SHA256);
    // the second hashes the archived index, deliberately mismatching.
    digestMock.mockReset();
    digestMock
      .mockResolvedValueOnce(new Uint8Array(32).buffer)
      .mockResolvedValueOnce(new Uint8Array(32).fill(1).buffer);
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'SHA-256 mismatch for archived index',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects when the archived index cannot be downloaded, and deletes the cache', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('index.html')) return new Response('nope', { status: 500 });
      return new Response('AAA');
    });
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Failed to download archived index',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, RELEASE_NUMBER);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('retries a previously incomplete cache from scratch without touching an unrelated already-valid cache of the same release number under a different channel', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    const committedMarker = await readReleaseDescriptorMarker(
      await fakeCaches.open(buildReleaseCacheName(CHANNEL, RELEASE_NUMBER)),
    );

    // Force a retry by deleting the cache (simulating an incomplete/evicted
    // local state), then make the download fail.
    await fakeCaches.delete(buildReleaseCacheName(CHANNEL, RELEASE_NUMBER));
    fetchMock.mockRejectedValue(new Error('offline'));

    const error: unknown = await prepareRelease(BASE_PATH, CHANNEL, descriptor).catch(
      (caught: unknown) => caught,
    );
    if (!(error instanceof DomainError)) throw new Error('Expected a DomainError');
    expect(error.message).toBe('Failed to download release file');
    if (!(error.cause instanceof Error)) throw new Error('Expected an Error cause');
    expect(error.cause.message).toBe('offline');
    expect(committedMarker).toEqual(descriptor);
  });
});

describe('release-preparation DomainError classification', () => {
  beforeEach(() => {
    cachesByName.clear();
    fetchMock.mockReset();
    digestMock.mockReset();
    mockDigestMatchesFileHash();
  });

  it('classifies latest.json fetch failure as ARCHIVE_UNAVAILABLE', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const { fetchLatestReleasePointer } = await import('./releasePreparation');

    await expect(fetchLatestReleasePointer(BASE_PATH)).rejects.toMatchObject({
      code: 'ARCHIVE_UNAVAILABLE',
    });
    await expect(fetchLatestReleasePointer(BASE_PATH)).rejects.toBeInstanceOf(DomainError);
  });

  it('never copies a path, URL, response text, or raw external error text into the safe message', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    const error: unknown = await fetchReleaseDescriptor(BASE_PATH, {
      releaseNumber: RELEASE_NUMBER,
    }).catch((caught: unknown) => caught);

    if (!(error instanceof DomainError)) throw new Error('Expected a DomainError');
    const message = error.message;
    expect(message).not.toMatch(/https?:\/\//);
    expect(message).not.toContain(BASE_PATH + 'updates');
    expect(message).not.toMatch(/\d{3}/);
  });

  it('classifies a structurally invalid latest.json as INVALID_ARCHIVE_METADATA', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ releaseNumber: 0 })));
    const { fetchLatestReleasePointer } = await import('./releasePreparation');

    await expect(fetchLatestReleasePointer(BASE_PATH)).rejects.toMatchObject({
      code: 'INVALID_ARCHIVE_METADATA',
    });
  });

  it('classifies a descriptor identity mismatch as INVALID_ARCHIVE_METADATA', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...descriptor, releaseNumber: 2 })));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(
      fetchReleaseDescriptor(BASE_PATH, { releaseNumber: RELEASE_NUMBER }),
    ).rejects.toMatchObject({ code: 'INVALID_ARCHIVE_METADATA' });
  });

  it('classifies a network-level throw during file download as ARCHIVE_UNAVAILABLE', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'ARCHIVE_UNAVAILABLE',
    });
  });

  it('classifies a byte-size mismatch as INTEGRITY_FAILURE', async () => {
    fetchMock.mockResolvedValue(new Response('too-long-a-body'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'INTEGRITY_FAILURE',
    });
  });

  it('classifies a SHA-256 mismatch as INTEGRITY_FAILURE', async () => {
    fetchMock.mockResolvedValue(new Response('AAA'));
    digestMock.mockResolvedValue(new Uint8Array(32).fill(1).buffer);
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'INTEGRITY_FAILURE',
    });
  });

  it('classifies a Cache Storage open failure as CACHE_STORAGE_UNAVAILABLE', async () => {
    mockSuccessfulDownloads();
    vi.stubGlobal('caches', {
      open: vi.fn().mockRejectedValue(new Error('storage disabled')),
      delete: vi.fn().mockResolvedValue(true),
    });
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'CACHE_STORAGE_UNAVAILABLE',
    });

    vi.stubGlobal('caches', fakeCaches);
  });

  it('classifies a Cache Storage write failure as CACHE_STORAGE_UNAVAILABLE', async () => {
    mockSuccessfulDownloads();
    const openMock = vi.fn().mockResolvedValue({
      match: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockRejectedValue(new Error('write failed')),
    });
    vi.stubGlobal('caches', { open: openMock, delete: vi.fn().mockResolvedValue(true) });
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'CACHE_STORAGE_UNAVAILABLE',
    });

    vi.stubGlobal('caches', fakeCaches);
  });

  it('falls back to RESTORATION_FAILED for an otherwise unclassified failure', async () => {
    mockSuccessfulDownloads();
    digestMock.mockRejectedValue(new Error('digest broke'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toMatchObject({
      code: 'RESTORATION_FAILED',
    });
  });
});
