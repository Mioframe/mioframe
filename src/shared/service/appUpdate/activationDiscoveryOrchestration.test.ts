import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';
import type { PreparationCoordinator } from './preparationCoordinator';

// Proves the Pass 2 orchestration invariant across two real collaborating
// modules (`updateDiscovery` and `workerMessages`), not just each module's
// own isolated unit tests: a discovery that happens while an activation is
// in progress must never be lost, but must also never disturb that
// activation's single, exclusive commit/rollback outcome.

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const prepareMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
}));
vi.stubGlobal('self', { clients: { matchAll: vi.fn().mockResolvedValue([]) } });
vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() });

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();
const coordinator: PreparationCoordinator = {
  prepare: (...args: unknown[]) => prepareMock(...args),
  runCleanup: (cleanup) => cleanup([]),
};

const CHANNEL_ORIGIN = 'https://mioframe.example';
const releaseA = { releaseId: 'release-a', releaseSequence: 1 };
const releaseB = { releaseId: 'release-b', releaseSequence: 2 };
const releaseC = { releaseId: 'release-c', releaseSequence: 3 };

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
  activation: { targetRelease: releaseB, deadlineAt: '2026-07-24T00:00:30.000Z' },
};

describe('activation vs. discovery orchestration', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    prepareMock.mockReset();
  });

  it('activation B, discover C, BOOT_OK(B): C becomes latestRelease without ever being prepared or approved, and commit does not lose it', async () => {
    const getCurrent = mockPersistentState(activatingB);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseC);

    const { runUpdateCheck } = await import('./updateDiscovery');
    const discovered = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(discovered.snapshot.latestRelease).toEqual(releaseC);
    expect(discovered.snapshot.scheduledRelease).toBeUndefined();
    expect(prepareMock).not.toHaveBeenCalled();
    expect(getCurrent().activation).toEqual(activatingB.activation);

    const { handleWorkerMessage } = await import('./workerMessages');
    const committed = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { type: 'BOOT_OK', releaseId: releaseB.releaseId },
      enqueue,
      coordinator,
    );

    expect(committed).toMatchObject({ ack: 'committed' });
    const final = getCurrent();
    expect(final.activeRelease).toEqual(releaseB);
    expect(final.activation).toBeUndefined();
    expect(final.approvedRelease).toBeUndefined();
    expect(final.latestRelease).toEqual(releaseC);
  });

  it('activation B, discover C, BOOT_FAILED(B): C remains latestRelease, B is recorded as the single failure, and rollback does not lose C', async () => {
    const getCurrent = mockPersistentState(activatingB);
    fetchLatestReleasePointerMock.mockResolvedValue(releaseC);

    const { runUpdateCheck } = await import('./updateDiscovery');
    const discovered = await runUpdateCheck('stable', '/', enqueue, coordinator);

    expect(discovered.snapshot.latestRelease).toEqual(releaseC);
    expect(prepareMock).not.toHaveBeenCalled();

    const { handleWorkerMessage } = await import('./workerMessages');
    const rolledBack = await handleWorkerMessage(
      'stable',
      '/',
      CHANNEL_ORIGIN,
      { type: 'BOOT_FAILED', releaseId: releaseB.releaseId },
      enqueue,
      coordinator,
    );

    expect(rolledBack).toMatchObject({ ack: 'rolled-back' });
    const final = getCurrent();
    expect(final.activeRelease).toEqual(releaseA);
    expect(final.activation).toBeUndefined();
    expect(final.approvedRelease).toBeUndefined();
    expect(final.failedActivationRelease).toEqual(releaseB);
    expect(final.latestRelease).toEqual(releaseC);
  });
});
