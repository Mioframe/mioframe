import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';
import {
  buildReleaseCacheNames,
  writeReleaseDescriptorMarker,
  writeReleaseIndexMarker,
} from './releaseCache';

const readControllerStateMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: vi.fn(),
}));
vi.mock('./releasePreparation', () => ({
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
}));

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
const fetchMock = vi.fn();

vi.stubGlobal('caches', fakeCaches);
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('self', { clients: { matchAll: () => Promise.resolve([]) } });

const BASE_PATH = '/';
const CHANNEL = 'stable';
const release: ReleaseRef = { releaseId: 'release-a', releaseSequence: 1 };
const descriptor: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: release.releaseId,
  releaseSequence: release.releaseSequence,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: '/updates/releases/release-a/index.html',
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

async function seedAvailableRelease(includeAssetFile = true): Promise<void> {
  const { final } = buildReleaseCacheNames(CHANNEL, release.releaseId);
  const finalCache = await caches.open(final);
  if (includeAssetFile) {
    await finalCache.put(`${BASE_PATH}assets/app.js`, new Response('console.log(1)'));
  }
  await writeReleaseIndexMarker(finalCache, '<html>archived</html>');
  // Written last, matching production ordering: presence is what "available" means.
  await writeReleaseDescriptorMarker(finalCache, descriptor);
}

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

describe('workerFetch', () => {
  beforeEach(() => {
    cachesByName.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('network response'));
    readControllerStateMock.mockReset();
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: release },
    });
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  describe('handleNavigationFetch', () => {
    it('serves the selected release navigation from its archived cache', async () => {
      await seedAvailableRelease();
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        false,
        enqueue,
      );

      expect(await response.text()).toBe('<html>archived</html>');
    });

    it('passes navigation through to the network when there is no managed state yet (e.g. mid-migration)', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      const { handleNavigationFetch } = await import('./workerFetch');

      const response = await handleNavigationFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/'),
        false,
        enqueue,
      );

      expect(await response.text()).toBe('network response');
      expect(fetchMock).toHaveBeenCalledTimes(1);
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
      );

      expect(await response.text()).toBe('console.log(1)');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reports a controlled unavailable response when the release cannot be restored, never falling through to the current live deployment', async () => {
      await seedAvailableRelease(false);
      fetchReleaseDescriptorMock.mockRejectedValue(new Error('offline'));
      const { handleAssetFetch } = await import('./workerFetch');

      const response = await handleAssetFetch(
        CHANNEL,
        BASE_PATH,
        new Request('https://mioframe.example/assets/app.js'),
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
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
