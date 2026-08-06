import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary } from './contracts';
import { createPreparationCoordinator } from './preparationCoordinator';
import { cleanupReleaseCache } from './workerBroadcast';

const readControllerStateMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
}));

const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();
vi.mock('./releasePreparation', async () => {
  const actual =
    await vi.importActual<typeof import('./releasePreparation')>('./releasePreparation');
  return {
    ...actual,
    fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
    prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
  };
});

const cachesKeysMock = vi.fn();
const cachesDeleteMock = vi.fn();
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const releaseSummary = (releaseNumber: number): ReleaseSummary => ({
  releaseNumber,
  appVersion: '1.0.0',
  buildId: `build-${releaseNumber}`,
  buildDate: '2026-07-24T00:00:00.000Z',
});

beforeEach(() => {
  readControllerStateMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
  prepareReleaseMock.mockReset().mockResolvedValue(undefined);
  cachesKeysMock.mockReset().mockResolvedValue([]);
  cachesDeleteMock.mockReset().mockResolvedValue(true);
});

/**
 * These tests exercise the real {@link createPreparationCoordinator} and the
 * real `runReleaseCacheCleanup` cache-deletion logic through
 * {@link cleanupReleaseCache} — only `readControllerState`, release
 * preparation, and the global `caches` API are mocked. A bare "runCleanup was
 * called" spy assertion cannot distinguish a cache that was actually removed
 * from one that was correctly preserved; these tests assert on real
 * `caches.delete` calls instead.
 */
describe('cleanupReleaseCache — real PreparationCoordinator + runReleaseCacheCleanup', () => {
  it('deletes nothing when controller state is absent: no caller-provided identity to act on', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('deletes nothing when controller state is invalid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid', reason: 'MALFORMED_RECORD' });
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('preserves the active release under valid state', async () => {
    const target = releaseSummary(5);
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: target },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-5']);
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('preserves the candidate release under valid state', async () => {
    const target = releaseSummary(5);
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: {
        schemaVersion: 1,
        mode: 'manual',
        activeRelease: releaseSummary(1),
        candidate: { phase: 'ready', release: target },
      },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-5']);
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('preserves a release still being prepared by a concurrent in-flight attempt', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: releaseSummary(1) },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-5']);
    const target = releaseSummary(5);
    const coordinator = createPreparationCoordinator();
    // Never resolves: keeps this concurrent prepare() attempt in-flight for
    // the whole test.
    fetchReleaseDescriptorMock.mockReturnValue(new Promise<never>(() => {}));
    void coordinator.prepare('stable', '/', target);

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-5');
  });

  it('deletes nothing when storage is unavailable', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'storage-unavailable' });
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesKeysMock).not.toHaveBeenCalled();
    expect(cachesDeleteMock).not.toHaveBeenCalled();
  });

  it('deletes an unowned release under ordinary valid-state cleanup', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { schemaVersion: 1, mode: 'automatic', activeRelease: releaseSummary(1) },
    });
    cachesKeysMock.mockResolvedValue(['stable-release-1', 'stable-release-5']);
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(cachesDeleteMock).toHaveBeenCalledWith('stable-release-5');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('stable-release-1');
  });
});
