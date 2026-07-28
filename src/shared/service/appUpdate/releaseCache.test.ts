import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor } from './contracts';
import {
  buildManagedCacheNamespace,
  buildReleaseCacheNames,
  checkReleaseAvailability,
  computeCacheNamesToDelete,
  computeProtectedReleaseIds,
  isReleaseAvailable,
  isReleaseFilePath,
  readReleaseDescriptorMarker,
  runReleaseCacheCleanup,
  writeReleaseDescriptorMarker,
} from './releaseCache';

const readControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const cachesKeysMock = vi.fn();
const cachesDeleteMock = vi.fn();
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: 'release-a',
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: 'sha1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: '/updates/releases/release-a/index.html',
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

describe('buildReleaseCacheNames', () => {
  it('produces distinct staging and final names namespaced by channel', () => {
    const stable = buildReleaseCacheNames('stable', 'release-a');
    const develop = buildReleaseCacheNames('develop', 'release-a');

    expect(stable.staging).not.toBe(stable.final);
    expect(stable.staging).not.toBe(develop.staging);
    expect(stable.final).not.toBe(develop.final);
  });
});

describe('isReleaseAvailable', () => {
  it('is true when the release identity matches and every file is present', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(descriptor, { releaseId: 'release-a', releaseSequence: 1 }, present),
    ).toBe(true);
  });

  it('is false when a listed file is missing', () => {
    const present = new Set(['assets/app.js']);
    expect(
      isReleaseAvailable(descriptor, { releaseId: 'release-a', releaseSequence: 1 }, present),
    ).toBe(false);
  });

  it('is false when the expected release id does not match the descriptor', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(descriptor, { releaseId: 'release-b', releaseSequence: 1 }, present),
    ).toBe(false);
  });

  it('is false when the expected release sequence does not match the descriptor', () => {
    const present = new Set(descriptor.files.map((file) => file.path));
    expect(
      isReleaseAvailable(descriptor, { releaseId: 'release-a', releaseSequence: 2 }, present),
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

  it('protects approved, activation target/previous, and the manual candidate', () => {
    const ids = computeProtectedReleaseIds({
      activeRelease: { releaseId: 'a', releaseSequence: 1 },
      approvedRelease: { releaseId: 'b', releaseSequence: 2 },
      activation: {
        targetRelease: { releaseId: 'c', releaseSequence: 3 },
        previousRelease: { releaseId: 'a', releaseSequence: 1 },
        startedAt: '2026-07-24T00:00:00.000Z',
        deadlineAt: '2026-07-24T00:00:30.000Z',
      },
      manualCandidateReleaseId: 'd',
    });
    expect(ids).toEqual(new Set(['a', 'b', 'c', 'd']));
  });
});

describe('computeCacheNamesToDelete', () => {
  it('deletes every staging cache in this channel unconditionally', () => {
    const result = computeCacheNamesToDelete(
      ['stable-release-staging-x', 'stable-release-staging-y'],
      'stable',
      new Set(),
    );
    expect(result).toEqual(['stable-release-staging-x', 'stable-release-staging-y']);
  });

  it('deletes unprotected final caches but keeps protected ones', () => {
    const result = computeCacheNamesToDelete(
      ['stable-release-final-a', 'stable-release-final-b'],
      'stable',
      new Set(['a']),
    );
    expect(result).toEqual(['stable-release-final-b']);
  });

  it('never touches caches outside this channel namespace', () => {
    const result = computeCacheNamesToDelete(
      ['branch-develop-release-final-a', 'workbox-precache-v2-stable', 'stable-google-fonts'],
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
});

describe('checkReleaseAvailability', () => {
  const channelBasePath = '/';
  const expectedRelease = { releaseId: 'release-a', releaseSequence: 1 };

  function buildMockCache(marker: Response | undefined, cachedPaths: string[]) {
    return {
      match: vi.fn(() => Promise.resolve(marker)),
      keys: vi.fn(() =>
        Promise.resolve(cachedPaths.map((path) => new Request(`https://mioframe.example${path}`))),
      ),
    };
  }

  it('is false when no marker is present', async () => {
    const cache = buildMockCache(undefined, []);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(false);
  });

  it('is true when the marker matches and every file is present', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const cache = buildMockCache(marker, ['/assets/app.js', '/assets/vendor.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(true);
  });

  it('is false when a file is missing from the cache', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const cache = buildMockCache(marker, ['/assets/app.js']);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(false);
  });

  it('ignores cached entries outside this channel base path', async () => {
    const marker = new Response(JSON.stringify(descriptor));
    const cache = buildMockCache(marker, [
      '/assets/app.js',
      '/assets/vendor.js',
      '/__release-descriptor-marker__',
    ]);
    expect(await checkReleaseAvailability(cache, expectedRelease, channelBasePath)).toBe(true);
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

  it('deletes staging and unprotected final caches, keeping protected ones', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
        failedReleaseIds: [],
      },
    });
    cachesKeysMock.mockResolvedValue([
      'stable-release-final-release-a',
      'stable-release-final-release-old',
      'stable-release-staging-release-b',
      'branch-develop-release-final-release-a',
    ]);

    await runReleaseCacheCleanup('stable');

    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-final-release-old');
    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-staging-release-b');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-final-release-a');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('branch-develop-release-final-release-a');
  });
});
