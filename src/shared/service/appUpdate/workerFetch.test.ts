import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';
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
  writeControllerState: vi.fn(),
}));

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();
const matchAllMock = vi.fn((): Promise<{ id: string; url: string }[]> => Promise.resolve([]));

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });

const BASE_PATH = '/';
const CHANNEL = 'stable';
const CHANNEL_ORIGIN = 'https://mioframe.example';
const release: ReleaseRef = {
  releaseId: '11111111-1111-4111-8111-111111111111',
  releaseSequence: 1,
};
const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: release.releaseId,
  releaseSequence: release.releaseSequence,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: `/updates/releases/${release.releaseId}/index.html`,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

async function seedAvailableRelease(includeAssetFile = true): Promise<void> {
  const cacheName = buildReleaseCacheName(CHANNEL, release.releaseId);
  const cache = await caches.open(cacheName);
  if (includeAssetFile) {
    await cache.put(`${BASE_PATH}assets/app.js`, new Response('console.log(1)'));
  }
  await writeReleaseIndexMarker(cache, '<html>archived</html>');
  // Written last, matching production ordering: presence is what "available" means.
  await writeReleaseDescriptorMarker(cache, descriptor);
}

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockRejectedValue(new Error('not prepared in this test')),
    getInFlightReleaseIds: () => [],
    runCleanup: (cleanup) => cleanup([]),
    ...overrides,
  };
}

describe('workerFetch', () => {
  beforeEach(() => {
    cachesByName.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('network response'));
    matchAllMock.mockReset();
    matchAllMock.mockResolvedValue([]);
    readControllerStateMock.mockReset();
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: release },
    });
  });

  describe('handleNavigationFetch', () => {
    it('serves the selected release navigation from its archived cache', async () => {
      await seedAvailableRelease();
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('passes navigation through to the network when there is no managed state yet', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('network response');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('restores a missing release through the shared preparation coordinator', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release },
      });
      const prepare = vi.fn().mockImplementation(async () => {
        await seedAvailableRelease();
        return descriptor;
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set<string>(),
        enqueue,
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledWith(CHANNEL, BASE_PATH, release);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    const approvedRelease = {
      releaseId: '22222222-2222-4222-8222-222222222222',
      releaseSequence: 2,
    };

    it('queries every live window, including uncontrolled ones, when deciding to activate', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, approvedRelease },
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(matchAllMock).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
    });

    it('starts activation when the only other live window is this navigation itself, excluded by id', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, approvedRelease },
      });
      matchAllMock.mockResolvedValue([{ id: 'this-navigation', url: 'https://mioframe.example/' }]);
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set(['this-navigation']),
        enqueue,
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
    });

    it('does not start activation while an uncontrolled same-channel window not excluded is live', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, approvedRelease },
      });
      await seedAvailableRelease();
      matchAllMock.mockResolvedValue([{ id: 'uncontrolled-a', url: 'https://mioframe.example/' }]);
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        false,
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      // Activation must not start: the release is served from `activeRelease`
      // (already seeded), not the unactivated `approvedRelease`.
      expect(await response.text()).toBe('<html>archived</html>');
    });
  });

  describe('handleAssetFetch', () => {
    it('serves an exact selected-release asset from its cache', async () => {
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

    it('reports a controlled unavailable response when the release cannot be restored, never falling through to the current live deployment', async () => {
      await seedAvailableRelease(false);
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

    it('passes a same-origin non-release request through to the network', async () => {
      await seedAvailableRelease();
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/manifest.webmanifest'),
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('network response');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('passes an API request through to the network without touching the release cache', async () => {
      await seedAvailableRelease();
      const { handleAssetFetch } = await import('./workerFetch');

      await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/api/whoami'),
        createFakeCoordinator(),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('passes every request through to the network when controller state is not valid', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleAssetFetch } = await import('./workerFetch');

      await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
        createFakeCoordinator(),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
