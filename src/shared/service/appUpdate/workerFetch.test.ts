import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary } from './contracts';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

const readControllerStateMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);

const BASE_PATH = '/';
const CHANNEL = 'stable';
const activeRelease: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const activeDescriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: activeRelease.releaseNumber,
  appVersion: activeRelease.appVersion,
  buildId: activeRelease.buildId,
  buildDate: activeRelease.buildDate,
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

async function seedAvailableRelease(
  release: ReleaseSummary = activeRelease,
  descriptor: ReleaseDescriptor = activeDescriptor,
  includeAssetFile = true,
): Promise<void> {
  const cacheName = buildReleaseCacheName(CHANNEL, release.releaseNumber);
  const cache = await caches.open(cacheName);
  if (includeAssetFile) {
    await cache.put(`${BASE_PATH}assets/app.js`, new Response('console.log(1)'));
  }
  await writeReleaseIndexMarker(cache, '<html>archived</html>');
  // Written last, matching production ordering: presence is what "available" means.
  await writeReleaseDescriptorMarker(cache, descriptor);
}

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockRejectedValue(new Error('not prepared in this test')),
    runCleanup: (cleanup) => cleanup([]),
    ...overrides,
  };
}

describe('workerFetch', () => {
  beforeEach(() => {
    cachesByName.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('network response'));
    readControllerStateMock.mockReset();
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease },
    });
  });

  describe('handleNavigationFetch', () => {
    it('serves the active release navigation from its archived index', async () => {
      await seedAvailableRelease();
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('<html>archived</html>');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('serves cached offline navigation with no network calls at all', async () => {
      await seedAvailableRelease();
      const { handleNavigationFetch } = await import('./workerFetch');

      await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator(),
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the controlled unavailable response when there is no managed state yet (absent), never falling through to the live deployment', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the controlled unavailable response for invalid controller state, without ever calling network fetch', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'invalid' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    const candidateReleaseForPhaseMatrix: ReleaseSummary = {
      releaseNumber: 2,
      appVersion: '2.0.0',
      buildId: 'build-2',
      buildDate: '2026-07-24T00:00:00.000Z',
    };

    it.each(['available', 'ready', 'activating', 'failed'] as const)(
      'never selects a candidate phase: only activeRelease is ever served while the candidate is %s',
      async (phase) => {
        await seedAvailableRelease();
        const candidate =
          phase === 'activating'
            ? {
                phase,
                release: candidateReleaseForPhaseMatrix,
                deadlineAt: '2026-07-24T00:00:30.000Z',
              }
            : { phase, release: candidateReleaseForPhaseMatrix };
        readControllerStateMock.mockResolvedValue({
          status: 'valid',
          state: { activeRelease, candidate },
        });
        const { handleNavigationFetch } = await import('./workerFetch');

        const response = await handleNavigationFetch(
          CHANNEL,
          BASE_PATH,
          new Request('https://mioframe.example/'),
          createFakeCoordinator(),
        );

        expect(await response.text()).toBe('<html>archived</html>');
      },
    );

    it('restores a missing active-release cache through the shared preparation coordinator', async () => {
      const prepare = vi.fn().mockImplementation(async () => {
        await seedAvailableRelease();
        return activeDescriptor;
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledWith(CHANNEL, BASE_PATH, activeRelease);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('restores when the archived index marker is missing even though the descriptor marker and files are present', async () => {
      const cacheName = buildReleaseCacheName(CHANNEL, activeRelease.releaseNumber);
      const cache = await caches.open(cacheName);
      await cache.put(`${BASE_PATH}assets/app.js`, new Response('console.log(1)'));
      await writeReleaseDescriptorMarker(cache, activeDescriptor);
      // No index marker written: available() must be false, forcing restoration.
      const prepare = vi.fn().mockImplementation(async () => {
        await seedAvailableRelease();
        return activeDescriptor;
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledTimes(1);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('restores when the descriptor marker is malformed JSON', async () => {
      const cacheName = buildReleaseCacheName(CHANNEL, activeRelease.releaseNumber);
      const cache = await caches.open(cacheName);
      await cache.put(
        'https://mioframe.internal/__release-descriptor-marker__',
        new Response('not valid json{'),
      );
      const prepare = vi.fn().mockImplementation(async () => {
        await seedAvailableRelease();
        return activeDescriptor;
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledTimes(1);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('restores when the marker shares the active release number but diverges on another identity field (rejected as a different release)', async () => {
      const mismatchedDescriptor: ReleaseDescriptor = {
        ...activeDescriptor,
        buildId: 'other-build',
      };
      await seedAvailableRelease(activeRelease, mismatchedDescriptor);
      const prepare = vi.fn().mockImplementation(async () => {
        cachesByName.delete(buildReleaseCacheName(CHANNEL, activeRelease.releaseNumber));
        await seedAvailableRelease();
        return activeDescriptor;
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledWith(CHANNEL, BASE_PATH, activeRelease);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('returns the controlled unavailable response when restoration fails, never falling back to another release or the live deployment', async () => {
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('handleAssetFetch', () => {
    it('serves an exact active-release asset from its cache', async () => {
      await seedAvailableRelease();
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('console.log(1)');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('serves cached offline assets with no network calls at all', async () => {
      await seedAvailableRelease();
      const { handleAssetFetch } = await import('./workerFetch');

      await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns a controlled 404 for an assets/** path not listed by the active descriptor, never falling through to the network', async () => {
      await seedAvailableRelease();
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/unlisted.js'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('restores a missing listed asset through the shared preparation coordinator', async () => {
      await seedAvailableRelease(activeRelease, activeDescriptor, false);
      const prepare = vi.fn().mockImplementation(async () => {
        await seedAvailableRelease();
        return activeDescriptor;
      });
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledWith(CHANNEL, BASE_PATH, activeRelease);
      expect(await response.text()).toBe('console.log(1)');
    });

    it('returns the controlled unavailable response when the release cannot be restored, never falling through to the current live deployment', async () => {
      await seedAvailableRelease(activeRelease, activeDescriptor, false);
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the controlled unavailable response when there is no managed state yet (absent), never falling through to the live deployment', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns the controlled unavailable response for an assets/** path when controller state is invalid, without calling network fetch', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'invalid' });
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('never selects a candidate phase: only activeRelease is ever served for an asset request', async () => {
      await seedAvailableRelease();
      const candidateRelease: ReleaseSummary = {
        releaseNumber: 2,
        appVersion: '2.0.0',
        buildId: 'build-2',
        buildDate: '2026-07-24T00:00:00.000Z',
      };
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          activeRelease,
          candidate: {
            phase: 'activating',
            release: candidateRelease,
            deadlineAt: '2026-07-24T00:00:30.000Z',
          },
        },
      });
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('console.log(1)');
    });
  });
});
