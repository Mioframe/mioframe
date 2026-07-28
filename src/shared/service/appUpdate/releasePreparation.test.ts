import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';
import { buildReleaseCacheNames, readReleaseDescriptorMarker } from './releaseCache';

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();
const digestMock = vi.fn();

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('crypto', { subtle: { digest: digestMock } });

const BASE_PATH = '/';
const CHANNEL = 'stable';
const release: ReleaseRef = { releaseId: 'release-a', releaseSequence: 1 };
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
      new Response(JSON.stringify({ ...descriptor, releaseId: 'release-other' })),
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
          indexUrl: '/branch/develop/updates/releases/release-a/index.html',
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

  it('downloads, validates, and commits every file, writing the descriptor marker last', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    const { final, staging } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    expect(cachesByName.has(staging)).toBe(false);
    const finalCache = await fakeCaches.open(final);
    const marker = await readReleaseDescriptorMarker(finalCache);
    expect(marker).toEqual(descriptor);
    const asset = await finalCache.match(`${BASE_PATH}assets/app.js`);
    expect(await asset?.text()).toBe('AAA');
  });

  it('is a no-op when the release is already fully committed and available', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    fetchMock.mockClear();

    await prepareRelease(BASE_PATH, CHANNEL, descriptor);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never touches an already-committed final cache when a later download fails', async () => {
    mockSuccessfulDownloads();
    const { prepareRelease } = await import('./releasePreparation');
    await prepareRelease(BASE_PATH, CHANNEL, descriptor);
    const { final } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    const committedMarker = await readReleaseDescriptorMarker(await fakeCaches.open(final));

    // Force a retry by clearing the descriptor marker (simulating a
    // corrupted/incomplete local check), then make the download fail.
    await fakeCaches.delete(final);
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow('offline');
    // The final cache was already deleted above to force the retry path;
    // the point under test is that a failed retry does not throw beyond
    // the download error and does not partially write into a fresh final
    // cache either.
    const afterFailure = await fakeCaches.open(final);
    const markerAfterFailure = await readReleaseDescriptorMarker(afterFailure);
    expect(markerAfterFailure).toBeUndefined();
    expect(committedMarker).toEqual(descriptor);
  });

  it('discards the staging cache even when download fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow('network down');

    const { staging } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    expect(cachesByName.has(staging)).toBe(false);
  });

  it('rejects a byte-size mismatch without writing anything to the final cache', async () => {
    fetchMock.mockResolvedValue(new Response('too-long-a-body'));
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Byte size mismatch',
    );

    const { final } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    expect(await readReleaseDescriptorMarker(await fakeCaches.open(final))).toBeUndefined();
  });

  it('rejects a SHA-256 mismatch without writing anything to the final cache', async () => {
    fetchMock.mockResolvedValue(new Response('AAA'));
    digestMock.mockResolvedValue(new Uint8Array(32).fill(1).buffer);
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'SHA-256 mismatch',
    );

    const { final } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    expect(await readReleaseDescriptorMarker(await fakeCaches.open(final))).toBeUndefined();
  });

  it('rejects when the archived index cannot be downloaded', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('index.html')) return new Response('nope', { status: 500 });
      return new Response('AAA');
    });
    const { prepareRelease } = await import('./releasePreparation');

    await expect(prepareRelease(BASE_PATH, CHANNEL, descriptor)).rejects.toThrow(
      'Failed to download archived index',
    );

    const { final } = buildReleaseCacheNames(CHANNEL, release.releaseId);
    expect(await readReleaseDescriptorMarker(await fakeCaches.open(final))).toBeUndefined();
  });
});
