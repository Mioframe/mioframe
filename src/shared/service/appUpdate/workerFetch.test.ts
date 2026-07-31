import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary } from './contracts';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();
type MockWindowClient = {
  id: string;
  url: string;
  type?: string;
  postMessage?: (message: unknown) => void;
};
const matchAllMock = vi.fn((): Promise<MockWindowClient[]> => Promise.resolve([]));

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });

const BASE_PATH = '/';
const CHANNEL = 'stable';
const CHANNEL_ORIGIN = 'https://mioframe.example';
const release: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: release.releaseNumber,
  appVersion: release.appVersion,
  buildId: release.buildId,
  buildDate: release.buildDate,
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

async function seedAvailableRelease(includeAssetFile = true): Promise<void> {
  const cacheName = buildReleaseCacheName(CHANNEL, release.releaseNumber);
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
    writeControllerStateMock.mockReset();
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: release },
    });
  });

  describe('handleNavigationFetch', () => {
    it('serves the selected release navigation from its archived cache', async () => {
      await seedAvailableRelease();
      const { handleNavigationFetch } = await import('./workerFetch');

      const { response, runLifetimeWork } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('<html>archived</html>');
      expect(runLifetimeWork).toBeUndefined();
    });

    it('passes navigation through to the network when there is no managed state yet', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const { response } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(await response.text()).toBe('network response');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns the controlled unavailable response for invalid controller state, without ever calling network fetch', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'invalid' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const { response } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
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

      const { response } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator({ prepare }),
      );

      expect(prepare).toHaveBeenCalledWith(CHANNEL, BASE_PATH, release);
      expect(await response.text()).toBe('<html>archived</html>');
    });

    const readyReleaseB: ReleaseSummary = {
      releaseNumber: 2,
      appVersion: '1.1.0',
      buildId: 'build-2',
      buildDate: '2026-07-24T00:00:00.000Z',
    };

    it('queries every live window, including uncontrolled ones, when deciding to activate', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, candidate: { phase: 'ready', release: readyReleaseB } },
      });
      const { handleNavigationFetch } = await import('./workerFetch');

      await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      expect(matchAllMock).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
    });

    it('starts activation on a reload of the only window: its own prior client is excluded by id, leaving otherLiveClientCount at 0', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, candidate: { phase: 'ready', release: readyReleaseB } },
      });
      matchAllMock.mockResolvedValue([{ id: 'this-navigation', url: 'https://mioframe.example/' }]);
      const { handleNavigationFetch } = await import('./workerFetch');

      const { response } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set(['this-navigation']),
        enqueue,
        createFakeCoordinator(),
      );

      // Activation started (candidate B now selected) but its cache was
      // never prepared in this test, so the controlled unavailable response
      // proves activation was attempted rather than silently skipped.
      expect(response.status).toBe(503);
      expect(writeControllerStateMock).toHaveBeenCalledWith(
        CHANNEL,
        expect.objectContaining({
          candidate: expect.objectContaining({ phase: 'activating', release: readyReleaseB }),
        }),
      );
    });

    it('does not start activation while an uncontrolled same-channel window not excluded is live', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { activeRelease: release, candidate: { phase: 'ready', release: readyReleaseB } },
      });
      await seedAvailableRelease();
      matchAllMock.mockResolvedValue([{ id: 'uncontrolled-a', url: 'https://mioframe.example/' }]);
      const { handleNavigationFetch } = await import('./workerFetch');

      const { response } = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        CHANNEL_ORIGIN,
        new Request('https://mioframe.example/'),
        new Set<string>(),
        enqueue,
        createFakeCoordinator(),
      );

      // Activation must not start: the release is served from `activeRelease`
      // (already seeded), not the unactivated ready candidate.
      expect(await response.text()).toBe('<html>archived</html>');
      expect(writeControllerStateMock).not.toHaveBeenCalled();
    });

    describe('expired activation recovery', () => {
      const activatingState = {
        activeRelease: release,
        candidate: {
          phase: 'activating' as const,
          release: readyReleaseB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      };

      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-24T00:01:00.000Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('rolls back to failed, serves the unchanged active release to the current navigation, and does not clean up the cache inline', async () => {
        await seedAvailableRelease();
        readControllerStateMock.mockResolvedValue({ status: 'valid', state: activatingState });
        const { handleNavigationFetch } = await import('./workerFetch');

        const { response } = await handleNavigationFetch(
          CHANNEL,
          BASE_PATH,
          CHANNEL_ORIGIN,
          new Request('https://mioframe.example/'),
          new Set<string>(),
          enqueue,
          createFakeCoordinator(),
        );

        expect(await response.text()).toBe('<html>archived</html>');
        expect(writeControllerStateMock).toHaveBeenCalledWith(
          CHANNEL,
          expect.objectContaining({
            activeRelease: release,
            candidate: { phase: 'failed', release: readyReleaseB },
          }),
        );
      });

      it('returns the rollback broadcast as tracked runLifetimeWork, excluding the current navigation from any window it reaches', async () => {
        await seedAvailableRelease();
        readControllerStateMock.mockResolvedValue({ status: 'valid', state: activatingState });
        const currentNavPostMessage = vi.fn();
        const otherWindowPostMessage = vi.fn();
        // First call: the gate check inside the locked transaction — no
        // other live same-channel window, so rollback proceeds. Second
        // call: the broadcast's own independent `matchAll`, which may
        // observe a window that appeared since (still correctly excluded
        // by id, never by timing).
        matchAllMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
          {
            id: 'this-navigation',
            type: 'window',
            url: 'https://mioframe.example/',
            postMessage: currentNavPostMessage,
          },
          {
            id: 'other-window',
            type: 'window',
            url: 'https://mioframe.example/settings',
            postMessage: otherWindowPostMessage,
          },
        ]);
        const { handleNavigationFetch } = await import('./workerFetch');

        const { runLifetimeWork } = await handleNavigationFetch(
          CHANNEL,
          BASE_PATH,
          CHANNEL_ORIGIN,
          new Request('https://mioframe.example/'),
          new Set(['this-navigation']),
          enqueue,
          createFakeCoordinator(),
        );

        expect(runLifetimeWork).toBeDefined();
        await runLifetimeWork?.();

        expect(currentNavPostMessage).not.toHaveBeenCalled();
        expect(otherWindowPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'APP_UPDATE_ROLLBACK',
            releaseNumber: readyReleaseB.releaseNumber,
          }),
        );
      });

      it('does not roll back while another same-channel window is still live', async () => {
        readControllerStateMock.mockResolvedValue({ status: 'valid', state: activatingState });
        matchAllMock.mockResolvedValue([{ id: 'other-window', url: 'https://mioframe.example/' }]);
        const { handleNavigationFetch } = await import('./workerFetch');

        await handleNavigationFetch(
          CHANNEL,
          BASE_PATH,
          CHANNEL_ORIGIN,
          new Request('https://mioframe.example/'),
          new Set<string>(),
          enqueue,
          createFakeCoordinator(),
        );

        expect(writeControllerStateMock).not.toHaveBeenCalled();
      });
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

    it('serves from the activating candidate, not the active release, while an activation is in progress', async () => {
      const activatingRelease: ReleaseSummary = {
        releaseNumber: 2,
        appVersion: '1.1.0',
        buildId: 'build-2',
        buildDate: '2026-07-24T00:00:00.000Z',
      };
      const activatingDescriptor: ReleaseDescriptor = { ...descriptor, releaseNumber: 2 };
      const cache = await caches.open(buildReleaseCacheName(CHANNEL, 2));
      await cache.put(`${BASE_PATH}assets/app.js`, new Response('console.log(2)'));
      await writeReleaseIndexMarker(cache, '<html>archived-2</html>');
      await writeReleaseDescriptorMarker(cache, activatingDescriptor);
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: {
          activeRelease: release,
          candidate: {
            phase: 'activating',
            release: activatingRelease,
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

      expect(await response.text()).toBe('console.log(2)');
    });

    it('passes every request through to the network when controller state is absent', async () => {
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

    it('still passes a manifest request through to the network when controller state is invalid', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'invalid' });
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

    it('still passes an API request through to the network when controller state is invalid', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'invalid' });
      const { handleAssetFetch } = await import('./workerFetch');

      await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/api/whoami'),
        createFakeCoordinator(),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
