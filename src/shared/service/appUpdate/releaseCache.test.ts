import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor } from './contracts';
import {
  buildManagedCacheNamespace,
  buildReleaseCacheName,
  checkReleaseAvailability,
  computeCacheNamesToDelete,
  computeProtectedReleaseNumbers,
  isReleaseAvailable,
  isReleaseFilePath,
  readReleaseDescriptorMarker,
  runReleaseCacheCleanup,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

const readControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const cachesKeysMock = vi.fn();
const cachesDeleteMock = vi.fn();
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const RELEASE_NUMBER = 1;

const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: RELEASE_NUMBER,
  appVersion: '1.0.0',
  buildId: 'sha1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [
    { path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 10 },
    { path: 'assets/vendor.js', sha256: '1'.repeat(64), byteSize: 20 },
  ],
};

const releaseSummary = (releaseNumber: number) => ({
  releaseNumber,
  appVersion: '1.0.0',
  buildId: `build-${releaseNumber}`,
  buildDate: '2026-07-24T00:00:00.000Z',
});

describe('buildManagedCacheNamespace', () => {
  it('produces distinct namespaces for stable and develop', () => {
    expect(buildManagedCacheNamespace('stable')).not.toBe(buildManagedCacheNamespace('develop'));
  });
});

describe('buildReleaseCacheName', () => {
  it('produces distinct names namespaced by channel', () => {
    expect(buildReleaseCacheName('stable', RELEASE_NUMBER)).not.toBe(
      buildReleaseCacheName('develop', RELEASE_NUMBER),
    );
  });
});

describe('isReleaseAvailable', () => {
  it('is true when the release identity matches and every file is present', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(isReleaseAvailable(descriptor, RELEASE_NUMBER, present)).toBe(true);
  });

  it('is false when a listed file is missing', () => {
    const present = new Set(['assets/app.js']);
    expect(isReleaseAvailable(descriptor, RELEASE_NUMBER, present)).toBe(false);
  });

  it('is false when the expected release number does not match the descriptor', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(isReleaseAvailable(descriptor, 2, present)).toBe(false);
  });
});

describe('isReleaseFilePath', () => {
  it('is true for a listed release file path', () => {
    expect(isReleaseFilePath(descriptor, 'assets/app.js')).toBe(true);
  });

  it('is false for a path not listed in the descriptor', () => {
    expect(isReleaseFilePath(descriptor, 'manifest.webmanifest')).toBe(false);
    expect(isReleaseFilePath(descriptor, 'api/whoami')).toBe(false);
  });
});

describe('computeProtectedReleaseNumbers', () => {
  it('always protects the active release', () => {
    const numbers = computeProtectedReleaseNumbers({ activeRelease: releaseSummary(1) });
    expect(numbers).toEqual(new Set([1]));
  });

  it('protects the candidate release and every in-flight preparation', () => {
    const numbers = computeProtectedReleaseNumbers({
      activeRelease: releaseSummary(1),
      candidate: { phase: 'available', release: releaseSummary(2) },
      inFlightReleaseNumbers: [3, 4],
    });
    expect(numbers).toEqual(new Set([1, 2, 3, 4]));
  });

  it('protects nothing beyond activeRelease when there is no candidate', () => {
    const numbers = computeProtectedReleaseNumbers({
      activeRelease: releaseSummary(1),
      inFlightReleaseNumbers: [],
    });
    expect(numbers).toEqual(new Set([1]));
  });
});

describe('computeCacheNamesToDelete — canonical release-number identity', () => {
  it.each([
    ['1', true],
    ['42', true],
    ['01', false],
    ['+1', false],
    ['1.0', false],
    ['1e0', false],
    ['0', false],
    ['-1', false],
    [String(Number.MAX_SAFE_INTEGER + 1), false],
  ])('recognizes "stable-release-%s" as an unprotected release cache: %s', (suffix, recognized) => {
    const name = `stable-release-${suffix}`;
    // No release number is protected, so a recognized canonical cache name
    // must be deleted; a non-canonical alias must never be recognized as any
    // release identity, so it is never returned as deletable either — it is
    // simply invisible to identity-based cleanup rather than aliasing a real
    // release number.
    expect(computeCacheNamesToDelete([name], 'stable', new Set())).toEqual(
      recognized ? [name] : [],
    );
  });

  it('never treats a non-canonical alias as the same identity as its canonical release number', () => {
    // Protecting release 1 must not cause the non-canonical alias "01" to be
    // treated as release 1 and thus also spared for that reason — it is
    // simply never recognized as a release cache at all.
    const result = computeCacheNamesToDelete(
      ['stable-release-01', 'stable-release-1'],
      'stable',
      new Set([1]),
    );
    expect(result).toEqual([]);
  });
});

describe('computeCacheNamesToDelete', () => {
  it('deletes unprotected release caches but keeps protected ones', () => {
    const result = computeCacheNamesToDelete(
      ['stable-release-1', 'stable-release-2'],
      'stable',
      new Set([1]),
    );
    expect(result).toEqual(['stable-release-2']);
  });

  it('never touches caches outside this channel namespace', () => {
    const result = computeCacheNamesToDelete(
      ['branch-develop-release-1', 'workbox-precache-v2-stable', 'stable-google-fonts'],
      'stable',
      new Set(),
    );
    expect(result).toEqual([]);
  });
});

const requestKey = (request: RequestInfo | URL): string =>
  typeof request === 'string'
    ? request
    : request instanceof Request
      ? request.url
      : request.toString();

describe('release descriptor marker', () => {
  it('round-trips a written marker through a mocked cache', async () => {
    const store = new Map<string, Response>();
    const cache = {
      put: vi.fn((request: RequestInfo | URL, response: Response) => {
        store.set(requestKey(request), response);
        return Promise.resolve();
      }),
      match: vi.fn((request: RequestInfo | URL) => Promise.resolve(store.get(requestKey(request)))),
    };

    await writeReleaseDescriptorMarker(cache, descriptor);
    const read = await readReleaseDescriptorMarker(cache);

    expect(read).toEqual(descriptor);
  });

  it('returns undefined when no marker is present', async () => {
    const cache = { match: vi.fn(() => Promise.resolve(undefined)) };
    expect(await readReleaseDescriptorMarker(cache)).toBeUndefined();
  });

  it('returns undefined when the marker body is not a valid descriptor', async () => {
    const cache = {
      match: vi.fn(() => Promise.resolve(new Response(JSON.stringify({ not: 'a descriptor' })))),
    };
    expect(await readReleaseDescriptorMarker(cache)).toBeUndefined();
  });

  it('returns undefined when the marker body is malformed JSON', async () => {
    const cache = { match: vi.fn(() => Promise.resolve(new Response('not valid json{'))) };
    expect(await readReleaseDescriptorMarker(cache)).toBeUndefined();
  });

  it('returns undefined when reading the marker body rejects', async () => {
    // A real `Response` whose body was already consumed once: a second
    // `.json()` call rejects with "body stream already read", exercising the
    // rejection path distinctly from a malformed-JSON parse failure.
    const response = new Response(JSON.stringify(descriptor));
    await response.text();
    const cache = { match: vi.fn(() => Promise.resolve(response)) };
    expect(await readReleaseDescriptorMarker(cache)).toBeUndefined();
  });
});

describe('checkReleaseAvailability', () => {
  const channelBasePath = '/';

  function buildMockCache(
    descriptorMarker: Response | undefined,
    indexMarker: Response | undefined,
    cachedPaths: string[],
  ) {
    return {
      match: vi.fn((request: RequestInfo | URL) => {
        const key = requestKey(request);
        if (key.endsWith('__release-descriptor-marker__')) return Promise.resolve(descriptorMarker);
        if (key.endsWith('__release-index-html__')) return Promise.resolve(indexMarker);
        return Promise.resolve(undefined);
      }),
      keys: vi.fn(() =>
        Promise.resolve(cachedPaths.map((path) => new Request(`https://mioframe.example${path}`))),
      ),
    };
  }

  it('is false when no marker is present', async () => {
    const cache = buildMockCache(undefined, undefined, []);
    expect(await checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).toBe(false);
  });

  it('is true when the marker matches, the index marker is present, and every file is present', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).toBe(true);
  });

  it('is false when the archived index marker is missing, even if the descriptor marker and files are present', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const cache = buildMockCache(marker, undefined, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).toBe(false);
  });

  it('is false, without throwing, when the descriptor marker is malformed JSON', async () => {
    const marker = new Response('not valid json{');
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    await expect(checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).resolves.toBe(
      false,
    );
  });

  it('is false when a file is missing from the cache', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js']);
    expect(await checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).toBe(false);
  });

  it('ignores cached entries outside this channel base path', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, RELEASE_NUMBER, channelBasePath)).toBe(true);
  });
});

describe('writeReleaseIndexMarker / index marker', () => {
  it('round-trips through a real in-memory cache', async () => {
    const store = new Map<string, Response>();
    const cache = {
      put: vi.fn((request: RequestInfo | URL, response: Response) => {
        store.set(requestKey(request), response);
        return Promise.resolve();
      }),
      match: vi.fn((request: RequestInfo | URL) => Promise.resolve(store.get(requestKey(request)))),
    };

    await writeReleaseIndexMarker(cache, '<html>archived</html>');
    const read = await cache.match('https://mioframe.internal/__release-index-html__');

    expect(await read?.text()).toBe('<html>archived</html>');
  });
});

describe('runReleaseCacheCleanup', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    cachesKeysMock.mockReset();
    cachesDeleteMock.mockReset();
  });

  it('is a no-op when persisted state is not valid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });

    await runReleaseCacheCleanup('stable');

    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('deletes unprotected release caches, keeping protected ones', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'manual', activeRelease: releaseSummary(1) },
    });
    cachesKeysMock.mockResolvedValue([
      'stable-release-1',
      'stable-release-99',
      'branch-develop-release-1',
    ]);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-99');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-1');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('branch-develop-release-1');
  });

  it('never deletes a release cache still being prepared', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'manual', activeRelease: releaseSummary(1) },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-2']);

    await runReleaseCacheCleanup('stable', [2]);

    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('protects a candidate release regardless of phase', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: releaseSummary(1),
        candidate: { phase: 'available', release: releaseSummary(2) },
      },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-2', 'stable-release-99']);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-1');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-2');
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-99');
  });

  it('lets a superseded candidate release become removable once a newer discovery replaces it', async () => {
    // C has replaced B as the candidate; B is no longer referenced by any
    // owner, so protecting the candidate does not retain release history.
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: releaseSummary(1),
        candidate: { phase: 'available', release: releaseSummary(3) },
      },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-2', 'stable-release-3']);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-1');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-3');
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-2');
  });
});
