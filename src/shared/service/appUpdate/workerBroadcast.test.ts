import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary } from './contracts';
import { createPreparationCoordinator } from './preparationCoordinator';
import { broadcastRollback, broadcastStateChanged, cleanupReleaseCache } from './workerBroadcast';

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

const captureDiagnosticExceptionMock = vi.fn();
vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: (...args: unknown[]) => captureDiagnosticExceptionMock(...args),
}));

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
  captureDiagnosticExceptionMock.mockReset();
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

describe('cleanupReleaseCache — diagnostic reporting', () => {
  it('reports a cleanup failure but still resolves (never rejects)', async () => {
    readControllerStateMock.mockRejectedValue(new Error('storage broke'));
    const coordinator = createPreparationCoordinator();

    await expect(cleanupReleaseCache('stable', coordinator)).resolves.toBeUndefined();

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      operation: 'releaseCacheCleanup',
      failureClassification: 'cleanupFailed',
    });
  });

  it('never reports a successful cleanup', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const coordinator = createPreparationCoordinator();

    await cleanupReleaseCache('stable', coordinator);

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});

describe('broadcastRollback — diagnostic reporting', () => {
  const clientsMatchAllMock = vi.fn();

  beforeEach(() => {
    clientsMatchAllMock.mockReset();
    vi.stubGlobal('self', {
      clients: { matchAll: (...args: unknown[]) => clientsMatchAllMock(...args) },
    });
  });

  it('reports and rethrows when clients.matchAll() itself fails, never an isolated per-client failure', async () => {
    clientsMatchAllMock.mockRejectedValue(new Error('clients API unavailable'));

    await expect(broadcastRollback('/', 'https://mioframe.example', 3)).rejects.toThrow(
      'clients API unavailable',
    );

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      operation: 'rollbackBroadcast',
      failureClassification: 'broadcastFailed',
    });
  });

  it('never reports when delivery to every matching client succeeds', async () => {
    clientsMatchAllMock.mockResolvedValue([]);

    await broadcastRollback('/', 'https://mioframe.example', 3);

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});

describe('broadcastStateChanged — diagnostic reporting', () => {
  const clientsMatchAllMock = vi.fn();

  beforeEach(() => {
    clientsMatchAllMock.mockReset();
    vi.stubGlobal('self', {
      clients: { matchAll: (...args: unknown[]) => clientsMatchAllMock(...args) },
    });
  });

  it('reports and rethrows when clients.matchAll() itself fails, and the caller may swallow the rejection', async () => {
    clientsMatchAllMock.mockRejectedValue(new Error('clients API unavailable'));

    const rejection = broadcastStateChanged('/', 'https://mioframe.example');

    await expect(rejection).rejects.toThrow('clients API unavailable');
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      operation: 'stateChangedBroadcast',
      failureClassification: 'broadcastFailed',
    });
    // Mirrors every real caller's own best-effort handling (see
    // workerBroadcast's callers in updateDiscovery.ts/workerMessages.ts): the
    // boundary above has already reported it, so swallowing here is safe.
    await expect(rejection.catch(() => {})).resolves.toBeUndefined();
  });

  it('never reports when clients.matchAll() succeeds, even with no matching clients', async () => {
    clientsMatchAllMock.mockResolvedValue([]);

    await broadcastStateChanged('/', 'https://mioframe.example');

    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });

  it('isolates one client postMessage() failure: other clients still receive the broadcast, and no diagnostic is reported', async () => {
    const broken = {
      id: 'broken-client',
      type: 'window' as const,
      url: 'https://mioframe.example/',
      postMessage: vi.fn(() => {
        throw new Error('channel closed');
      }),
    };
    const healthy = {
      id: 'healthy-client',
      type: 'window' as const,
      url: 'https://mioframe.example/',
      postMessage: vi.fn(),
    };
    clientsMatchAllMock.mockResolvedValue([broken, healthy]);

    await broadcastStateChanged('/', 'https://mioframe.example');

    expect(broken.postMessage).toHaveBeenCalledTimes(1);
    expect(healthy.postMessage).toHaveBeenCalledTimes(1);
    expect(captureDiagnosticExceptionMock).not.toHaveBeenCalled();
  });
});
