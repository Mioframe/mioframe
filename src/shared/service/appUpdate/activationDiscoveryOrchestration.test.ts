import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseSummary, UpdateControllerState } from './contracts';
import type { PreparationCoordinator } from './preparationCoordinator';

// Proves the single-candidate serialization invariant across two real
// collaborating modules (`updateDiscovery` and `workerMessages`), not just
// each module's own isolated unit tests: while a candidate is `activating`,
// it is pinned — discovery of a newer release is a true no-op, and only
// once the activation resolves (commit or rollback) does the next release
// become discoverable. This is the intentional deterministic sequencing the
// architecture handoff calls out explicitly (B activating, C published -> C
// is considered only after B commits or is cancelled).

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
}));
vi.stubGlobal('self', { clients: { matchAll: vi.fn().mockResolvedValue([]) } });
vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() });

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator: PreparationCoordinator = {
  prepare: (...args: unknown[]) => prepareMock(...args),
  runCleanup: (cleanup) => cleanup([]),
};

const CHANNEL_ORIGIN = 'https://mioframe.example';
const releaseA: ReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseB: ReleaseSummary = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const releaseC: ReleaseSummary = {
  releaseNumber: 3,
  appVersion: '1.2.0',
  buildId: 'build-c',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const descriptorC: ReleaseDescriptor = {
  schemaVersion: 1,
  releaseNumber: releaseC.releaseNumber,
  appVersion: releaseC.appVersion,
  buildId: releaseC.buildId,
  buildDate: releaseC.buildDate,
  indexSha256: '0'.repeat(64),
  indexByteSize: 100,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};

/**
 * Wires the mocked read/write so a write actually becomes visible to the
 * next read, so both calls in this test observe one continuous persisted
 * state, exactly like the real worker.
 * @param initial - The initial persisted state.
 * @returns A getter for the current persisted state.
 */
function mockPersistentState(initial: UpdateControllerState): () => UpdateControllerState {
  let current = initial;
  readControllerStateMock.mockImplementation(() => ({ status: 'valid', state: current }));
  writeControllerStateMock.mockImplementation((_channel: string, next: UpdateControllerState) => {
    current = next;
  });
  return () => current;
}

const activatingB: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'automatic',
  activeRelease: releaseA,
  candidate: { phase: 'activating', release: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
};

describe('activation vs. discovery orchestration', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    prepareMock.mockReset();
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorC);
  });

  it('activating B pins the candidate: discovering C is a true no-op, never storing or preparing it', async () => {
    const getCurrent = mockPersistentState(activatingB);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseC.releaseNumber });

    const { runDiscovery } = await import('./updateDiscovery');
    const discovered = await runDiscovery('stable', '/', enqueue);

    expect(discovered.durablyChanged).toBe(false);
    expect(discovered.response.snapshot.candidate).toEqual(activatingB.candidate);
    // Discovery never even fetches while pinned: the fetch mocks above are
    // configured but runDiscovery's own state check happens first in
    // production via runScheduledDiscoveryCheck; here runDiscovery itself
    // proves the pure no-op at the state layer.
    expect(prepareMock).not.toHaveBeenCalled();
    expect(getCurrent().candidate).toEqual(activatingB.candidate);
  });

  it('the background scheduler skips discovery entirely for an activating candidate: no fetch at all', async () => {
    mockPersistentState(activatingB);
    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseC.releaseNumber });

    const { runScheduledDiscoveryCheck } = await import('./updateDiscovery');
    await runScheduledDiscoveryCheck('stable', '/', CHANNEL_ORIGIN, enqueue, coordinator);

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
  });

  it('BOOT_OK(B) commits and clears the candidate; C becomes discoverable only afterwards', async () => {
    const getCurrent = mockPersistentState(activatingB);
    const { handleWorkerMessage } = await import('./workerMessages');

    const committed = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { protocolVersion: 1, type: 'BOOT_OK', releaseNumber: releaseB.releaseNumber },
      enqueue,
      coordinator,
    );

    expect(committed.response).toMatchObject({ ack: 'committed' });
    expect(getCurrent().activeRelease).toEqual(releaseB);
    expect(getCurrent().candidate).toBeUndefined();

    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseC.releaseNumber });
    const { runDiscovery } = await import('./updateDiscovery');
    const discovered = await runDiscovery('stable', '/', enqueue);

    expect(discovered.candidateReplaced).toBe(true);
    expect(getCurrent().candidate).toEqual({ phase: 'available', release: releaseC });
  });

  it('BOOT_FAILED(B) rolls back to failed(B), leaving active unchanged; C becomes discoverable only afterwards (Automatic mode)', async () => {
    const getCurrent = mockPersistentState(activatingB);
    const { handleWorkerMessage } = await import('./workerMessages');

    const rolledBack = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { protocolVersion: 1, type: 'BOOT_FAILED', releaseNumber: releaseB.releaseNumber },
      enqueue,
      coordinator,
    );

    expect(rolledBack.response).toMatchObject({ ack: 'rolled-back' });
    expect(getCurrent().activeRelease).toEqual(releaseA);
    expect(getCurrent().candidate).toEqual({ phase: 'failed', release: releaseB });

    fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseC.releaseNumber });
    const { runDiscovery } = await import('./updateDiscovery');
    const discovered = await runDiscovery('stable', '/', enqueue);

    // Automatic discovery may replace a failed candidate with a strictly
    // newer release.
    expect(discovered.candidateReplaced).toBe(true);
    expect(getCurrent().candidate).toEqual({ phase: 'available', release: releaseC });
  });
});
