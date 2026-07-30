import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor } from './contracts';
import {
  buildManagedCacheNamespace,
  buildReleaseCacheName,
  checkReleaseAvailability,
  computeCacheNamesToDelete,
  computeProtectedReleaseIds,
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

const RELEASE_ID = '11111111-1111-4111-8111-111111111111';

const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: RELEASE_ID,
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: 'sha1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: `/updates/releases/${RELEASE_ID}/index.html`,
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [
    { path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 10 },
    { path: 'assets/vendor.js', sha256: '1'.repeat(64), byteSize: 20 },
  ],
};

describe('buildManagedCacheNamespace', () => {
  it('produces distinct namespaces for stable and develop', () => {
    expect(buildManagedCacheNamespace('stable')).not.toBe(buildManagedCacheNamespace('develop'));
  });
});

describe('buildReleaseCacheName', () => {
  it('produces distinct names namespaced by channel', () => {
    expect(buildReleaseCacheName('stable', RELEASE_ID)).not.toBe(
      buildReleaseCacheName('develop', RELEASE_ID),
    );
  });
});

describe('isReleaseAvailable', () => {
  it('is true when the release identity matches and every file is present', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(descriptor, { releaseId: RELEASE_ID, releaseSequence: 1 }, present),
    ).toBe(true);
  });

  it('is false when a listed file is missing', () => {
    const present = new Set(['assets/app.js']);
    expect(
      isReleaseAvailable(descriptor, { releaseId: RELEASE_ID, releaseSequence: 1 }, present),
    ).toBe(false);
  });

  it('is false when the expected release id does not match the descriptor', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(
        descriptor,
        { releaseId: '22222222-2222-4222-8222-222222222222', releaseSequence: 1 },
        present,
      ),
    ).toBe(false);
  });

  it('is false when the expected release sequence does not match the descriptor', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(descriptor, { releaseId: RELEASE_ID, releaseSequence: 2 }, present),
    ).toBe(false);
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

describe('computeProtectedReleaseIds', () => {
  it('always protects the active release', () => {
    const ids = computeProtectedReleaseIds({
      activeRelease: { releaseId: 'a', releaseSequence: 1 },
    });
    expect(ids).toEqual(new Set(['a']));
  });

  it('protects latest, approved, activation target, and every in-flight preparation', () => {
    const ids = computeProtectedReleaseIds({
      activeRelease: { releaseId: 'a', releaseSequence: 1 },
      latestRelease: { releaseId: 'b', releaseSequence: 2 },
      approvedRelease: { releaseId: 'c', releaseSequence: 3 },
      activation: {
        targetRelease: {
          releaseId: 'd',
          releaseSequence: 4,
          appVersion: '1.0.0',
          buildId: 'build-d',
          buildDate: '2026-07-24T00:00:00.000Z',
        },
        deadlineAt: '2026-07-24T00:00:30.000Z',
      },
      inFlightReleaseIds: ['e', 'f'],
    });
    expect(ids).toEqual(new Set(['a', 'b', 'c', 'd', 'e', 'f']));
  });
});

describe('computeCacheNamesToDelete', () => {
  it('deletes unprotected release caches but keeps protected ones', () => {
    const result = computeCacheNamesToDelete(
      ['stable-release-a', 'stable-release-b'],
      'stable',
      new Set(['a']),
    );
    expect(result).toEqual(['stable-release-b']);
  });

  it('never touches caches outside this channel namespace', () => {
    const result = computeCacheNamesToDelete(
      ['branch-develop-release-a', 'workbox-precache-v2-stable', 'stable-google-fonts'],
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
  const expectedRelease = { releaseId: RELEASE_ID, releaseSequence: 1 };

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
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(false);
  });

  it('is true when the marker matches, the index marker is present, and every file is present', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(true);
  });

  it('is false when the archived index marker is missing, even if the descriptor marker and files are present', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const cache = buildMockCache(marker, undefined, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(false);
  });

  it('is false, without throwing, when the descriptor marker is malformed JSON', async () => {
    const marker = new Response('not valid json{');
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    await expect(checkReleaseAvailability(cache, expectedRelease, channelBasePath)).resolves.toBe(
      false,
    );
  });

  it('is false when a file is missing from the cache', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(false);
  });

  it('ignores cached entries outside this channel base path', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const indexMarker = new Response('<html>archived</html>');
    const cache = buildMockCache(marker, indexMarker, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(true);
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
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: { releaseId: RELEASE_ID, releaseSequence: 1 },
      },
    });
    cachesKeysMock.mockResolvedValue([
      `stable-release-${RELEASE_ID}`,
      'stable-release-release-old',
      `branch-develop-release-${RELEASE_ID}`,
    ]);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-release-old');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith(`stable-release-${RELEASE_ID}`);
    expect(cachesDeleteMock).not.toHaveBeenCalledWith(`branch-develop-release-${RELEASE_ID}`);
  });

  it('never deletes a release cache still being prepared', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: { releaseId: RELEASE_ID, releaseSequence: 1 },
      },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-in-flight']);

    await runReleaseCacheCleanup('stable', ['in-flight']);

    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('protects a completed latest release that has left in-flight preparation but is not yet approved', async () => {
    // B has finished preparation (no longer in inFlightReleaseIds) but the
    // caller has not yet persisted approvedRelease B: latestRelease is B's
    // only remaining owner until approval lands.
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
        latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
      },
    });
    cachesKeysMock.mockResolvedValue([
      'stable-release-release-a',
      'stable-release-release-b',
      'stable-release-release-x',
    ]);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-release-a');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-release-b');
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-release-x');
  });

  it('lets a superseded latest release become removable once a newer discovery replaces it', async () => {
    // C has replaced B as latestRelease; B is no longer referenced by any
    // owner, so protecting latestRelease does not retain release history.
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
        latestRelease: { releaseId: 'release-c', releaseSequence: 3 },
      },
    });
    cachesKeysMock.mockResolvedValue([
      'stable-release-release-a',
      'stable-release-release-b',
      'stable-release-release-c',
    ]);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-release-a');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-release-c');
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-release-b');
  });
});
