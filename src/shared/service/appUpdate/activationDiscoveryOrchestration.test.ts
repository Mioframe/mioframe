import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary, UpdateControllerState } from './contracts';
import { createOperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import { createUpdateReconciler } from './updateReconciliation';
import { runUpdateReconciliationPass } from './updateDiscovery';
import { handleWorkerMessage } from './workerMessages';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
}));
vi.stubGlobal('self', { clients: { matchAll: () => Promise.resolve([]) } });
vi.stubGlobal('caches', { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) });

const releaseA: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-08-02T00:00:00.000Z',
};
const descriptorB: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-08-02T00:00:00.000Z',
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

describe('mode-change reconciliation races', () => {
  let state: UpdateControllerState;
  const enqueue = createOperationQueue();

  beforeEach(() => {
    state = { schemaVersion: 1, mode: 'manual', activeRelease: releaseA };
    readControllerStateMock.mockReset().mockImplementation(() => ({ status: 'valid', state }));
    writeControllerStateMock.mockReset().mockImplementation((_channel, next) => {
      state = next;
    });
    fetchLatestReleasePointerMock.mockReset().mockResolvedValue({ releaseNumber: 2 });
    fetchReleaseDescriptorMock.mockReset().mockResolvedValue(descriptorB);
  });

  function setup(coordinator: PreparationCoordinator) {
    const reconciler = createUpdateReconciler({
      runPass: () =>
        runUpdateReconciliationPass({
          channel: 'stable',
          channelBasePath: '/',
          channelOrigin: 'https://mioframe.example',
          enqueue,
          coordinator,
        }),
    });
    return reconciler;
  }

  it('reruns from Automatic after Manual discovery is switched in flight', async () => {
    const discovery = deferred<ReleaseDescriptor>();
    fetchReleaseDescriptorMock
      .mockImplementationOnce(() => discovery.promise)
      .mockResolvedValue(descriptorB);
    const prepare = vi.fn().mockResolvedValue(descriptorB);
    const coordinator: PreparationCoordinator = { prepare, runCleanup: (cleanup) => cleanup([]) };
    const reconciler = setup(coordinator);
    const check = reconciler.checkForUpdates();
    await vi.waitFor(() => {
      expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
    });

    const modeResult = await handleWorkerMessage(
      'stable',
      '/',
      'https://mioframe.example',
      { protocolVersion: 1, type: 'SET_MODE', mode: 'automatic' },
      enqueue,
      coordinator,
      reconciler,
    );
    expect('snapshot' in modeResult.response && modeResult.response.snapshot.mode).toBe(
      'automatic',
    );
    // `modeResult.runLifetimeWork` joins the Check-created attempt and
    // requests its rerun; as a joiner it only awaits release, it never
    // triggers it — the Check's own returned callback below owns that,
    // exactly like `workerMessages` invoking it after posting its response.
    const followUp = modeResult.runLifetimeWork?.();
    discovery.resolve(descriptorB);

    const checkResult = await check;
    expect(checkResult.snapshot).toMatchObject({
      mode: 'automatic',
      candidate: { phase: 'ready' },
    });
    await checkResult.runLifetimeWork?.();
    await followUp;
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('does not persist stale Automatic preparation after switching to Manual', async () => {
    state = {
      schemaVersion: 1,
      mode: 'automatic',
      activeRelease: releaseA,
      candidate: { phase: 'available', release: { ...descriptorB } },
    };
    const preparation = deferred<ReleaseDescriptor>();
    const prepare = vi.fn(() => preparation.promise);
    const coordinator: PreparationCoordinator = { prepare, runCleanup: (cleanup) => cleanup([]) };
    const reconciler = setup(coordinator);
    const check = reconciler.checkForUpdates();
    await vi.waitFor(() => {
      expect(prepare).toHaveBeenCalledTimes(1);
    });

    const modeResult = await handleWorkerMessage(
      'stable',
      '/',
      'https://mioframe.example',
      { protocolVersion: 1, type: 'SET_MODE', mode: 'manual' },
      enqueue,
      coordinator,
      reconciler,
    );
    const followUp = modeResult.runLifetimeWork?.();
    preparation.resolve(descriptorB);

    const checkResult = await check;
    expect(checkResult.snapshot).toMatchObject({
      mode: 'manual',
      candidate: { phase: 'available' },
    });
    await checkResult.runLifetimeWork?.();
    await followUp;
    expect(state.mode).toBe('manual');
    expect(state.candidate?.phase).toBe('available');
    expect(prepare).toHaveBeenCalledTimes(1);
  });
});
