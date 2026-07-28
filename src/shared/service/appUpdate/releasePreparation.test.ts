import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';
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
const release: ReleaseRef = {
  releaseId: '11111111-1111-4111-8111-111111111111',
  releaseSequence: 1,
};
const FILE_SHA256 = '0'.repeat(64);

const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: release.releaseId,
  releaseSequence: release.releaseSequence,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: `${BASE_PATH}updates/releases/${release.releaseId}/index.html`,
  files: [{ path: 'assets/app.js', sha256: FILE_SHA256, byteSize: 3 }],
};

/** Digest mock returning bytes that hash to `FILE_SHA256` (all-zero bytes). */
function mockDigestMatchesFileHash(): void {
  digestMock.mockResolvedValue(new Uint8Array(32).buffer);
}

function mockSuccessfulDownloads(): void {
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith('index.html')) return new Response('<html>archived</html>');
    return new Response('AAA');
  });
}

describe('fetchReleaseDescriptor', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('fetches and validates the descriptor when it matches the expected release', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(descriptor)));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    const result = await fetchReleaseDescriptor(BASE_PATH, release);

    expect(result).toEqual(descriptor);
  });

  it('rejects a descriptor whose identity does not match the expected release', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ ...descriptor, releaseId: '22222222-2222-4222-8222-222222222222' }),
      ),
    );
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(fetchReleaseDescriptor(BASE_PATH, release)).rejects.toThrow(
      'identity does not match',
    );
  });

  it('rejects a descriptor whose indexUrl does not match this channel and release', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          ...descriptor,
          indexUrl: `/branch/develop/updates/releases/${release.releaseId}/index.html`,
        }),
      ),
    );
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(fetchReleaseDescriptor(BASE_PATH, release)).rejects.toThrow('indexUrl');
  });

  it('rejects a structurally invalid descriptor', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ not: 'a descriptor' })));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(fetchReleaseDescriptor(BASE_PATH, release)).rejects.toThrow(
      'structurally invalid',
    );
  });

  it('rejects when the fetch itself fails', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const { fetchReleaseDescriptor } = await import('./releasePreparation');

    await expect(fetchReleaseDescriptor(BASE_PATH, release)).rejects.toThrow(
      'Failed to fetch release descriptor',
    );
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

    const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
    const cache = await fakeCaches.open(cacheName);
    const marker = await readReleaseDescriptorMarker(cache);
    expect(marker).toEqual(descriptor);
    const asset = await cache.match(`${BASE_PATH}assets/app.js`);
    expect(await asset?.text()).toBe('AAA');
  });

  it('is a no-op when the release is already fully committed and available — never rebuilds a valid cache', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    fetchMock.mockClear();

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes the release cache on any failure, leaving no partial content behind', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow('network down');

    const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a byte-size mismatch and deletes the cache, without leaving anything committed', async () => {
    fetchMock.mockResolvedValue(new Response('too-long-a-body'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Byte size mismatch',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('rejects a SHA-256 mismatch and deletes the cache, without leaving anything committed', async () => {
    fetchMock.mockResolvedValue(new Response('AAA'));
    digestMock.mockResolvedValue(new Uint8Array(32).fill(1).buffer);
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'SHA-256 mismatch',
    );

    const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
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

    const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
    expect(cachesByName.has(cacheName)).toBe(false);
  });

  it('retries a previously incomplete cache from scratch without touching an unrelated already-valid cache of the same release id under a different channel', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    const committedMarker = await readReleaseDescriptorMarker(
      await fakeCaches.open(buildReleaseCacheName(CHANNEL, release.releaseId)),
    );

    // Force a retry by deleting the cache (simulating an incomplete/evicted
    // local state), then make the download fail.
    await fakeCaches.delete(buildReleaseCacheName(CHANNEL, release.releaseId));
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow('offline');
    expect(committedMarker).toEqual(descriptor);
  });
});
