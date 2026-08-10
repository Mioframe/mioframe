import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseSummary, UpdateControllerState } from './contracts';
import { createOperationQueue } from './operationQueue';
import {
  createPreparationCoordinator,
  type PreparationCoordinator,
} from './preparationCoordinator';
import type { UpdateReconciler } from './updateReconciliation';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
type MockWindowClient = { type: 'window'; url: string; postMessage: (message: unknown) => void };
const matchAllMock = vi.fn((): Promise<MockWindowClient[]> => Promise.resolve([]));
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();
const cachesKeysMock = vi.fn();
const cachesDeleteMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', async () => {
  const actual =
    await vi.importActual<typeof import('./releasePreparation')>('./releasePreparation');
  return {
    ...actual,
    fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
    fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
    prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
  };
});
vi.stubGlobal('self', { clients: { matchAll: matchAllMock } });
vi.stubGlobal('caches', { keys: cachesKeysMock, delete: cachesDeleteMock });

const PROTOCOL_VERSION = 1 as const;
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

const baseState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: releaseA,
};

const enqueue = <T>(operation: () => Promise<T>): Promise<T> => operation();

function createFakeCoordinator(
  overrides: Partial<PreparationCoordinator> = {},
): PreparationCoordinator {
  return {
    prepare: vi.fn().mockResolvedValue(undefined),
    runCleanup: (cleanup) => cleanup([]),
    ...overrides,
  };
}

function createFakeReconciler(overrides: Partial<UpdateReconciler> = {}): UpdateReconciler {
  return {
    reconcileNavigation: vi.fn().mockResolvedValue(undefined),
    checkForUpdates: vi
      .fn()
      .mockResolvedValue({ snapshot: { mode: 'manual', activeRelease: releaseA } }),
    reconcileAfterModeChange: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  readControllerStateMock.mockReset();
  writeControllerStateMock.mockReset();
  matchAllMock.mockClear();
  matchAllMock.mockResolvedValue([]);
  readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
  fetchLatestReleasePointerMock.mockReset();
  fetchReleaseDescriptorMock.mockReset();
  prepareReleaseMock.mockReset().mockResolvedValue(undefined);
  cachesKeysMock.mockReset().mockResolvedValue([]);
  cachesDeleteMock.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('handleWorkerMessage', () => {
  describe('RECOVER_INSTALL_LATEST', () => {
    const descriptorFor = (summary: ReleaseSummary) => ({
      schemaVersion: 1 as const,
      ...summary,
      indexSha256: '0'.repeat(64),
      indexByteSize: 100,
      files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
    });

    it.each(['absent', 'invalid'] as const)(
      'never throws for %s persisted state, unlike every withState()-routed command',
      async (status) => {
        readControllerStateMock.mockResolvedValue(
          status === 'invalid'
            ? { status: 'invalid', reason: 'MALFORMED_RECORD' }
            : { status: 'absent' },
        );
        fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
        fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
        const { handleWorkerMessage } = await import('./workerMessages');

        const result = await handleWorkerMessage(
          'stable',
          '/',
          CHANNEL_ORIGIN,
          { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
          enqueue,
          createFakeCoordinator(),
          createFakeReconciler(),
        );

        expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      },
    );

    it('responds with the stable result code, never a snapshot, and schedules cleanup plus a state-changed broadcast when this attempt durably changed state', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      expect(result.runLifetimeWork).toBeTypeOf('function');

      await result.runLifetimeWork?.();
      expect(runCleanup).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({
        protocolVersion: PROTOCOL_VERSION,
        type: 'APP_UPDATE_STATE_CHANGED',
      });
    });

    it('carries no follow-up work for an idempotent success that changed no state (exact-active re-preparation, no write)', async () => {
      // Cleanup ownership must come from this attempt's own facts, not the
      // bare `success` code: a no-write idempotent success must schedule
      // neither cleanup nor a broadcast, unlike a state-loss/stage-candidate
      // success that actually wrote controller state (see the previous test).
      readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      expect(result.runLifetimeWork).toBeUndefined();
      expect(runCleanup).not.toHaveBeenCalled();
    });

    it('carries no follow-up work for a conflict detected before preparation ever started (latest-older-than-active)', async () => {
      readControllerStateMock.mockResolvedValue({
        status: 'valid',
        state: { ...baseState, activeRelease: releaseB },
      });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseA));
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        createFakeCoordinator(),
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'latest-older-than-active',
      });
      expect(result.runLifetimeWork).toBeUndefined();
    });

    it('carries no follow-up work for a same-number identity conflict detected before preparation ever started (conflicting-release-identity)', async () => {
      // Never schedules cleanup here: no release was ever prepared this
      // attempt, unlike the post-preparation conflict covered below.
      readControllerStateMock.mockResolvedValue({ status: 'valid', state: baseState });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseA.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(
        descriptorFor({ ...releaseA, buildId: 'conflicting-build' }),
      );
      const coordinator = createFakeCoordinator();
      const runCleanup = vi.spyOn(coordinator, 'runCleanup');
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'conflicting-release-identity',
      });
      expect(result.runLifetimeWork).toBeUndefined();
      expect(runCleanup).not.toHaveBeenCalled();
    });

    it('schedules no follow-up work once state-changed proves this attempt’s prepared release B was never adopted, leaving its cache untouched', async () => {
      // Uses the real PreparationCoordinator/runReleaseCacheCleanup, not a
      // mocked runCleanup-was-called assertion: proves the cache entry is
      // genuinely left alone, not merely that no explicit deletion call was
      // made.
      readControllerStateMock
        .mockResolvedValueOnce({ status: 'absent' })
        .mockResolvedValueOnce({
          status: 'valid',
          state: { ...baseState, activeRelease: releaseC },
        })
        .mockResolvedValueOnce({
          status: 'valid',
          state: { ...baseState, activeRelease: releaseC },
        });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      cachesKeysMock.mockResolvedValue([`stable-release-${releaseB.releaseNumber}`]);
      const coordinator = createPreparationCoordinator();
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'state-changed',
      });
      expect(result.runLifetimeWork).toBeUndefined();
      expect(cachesDeleteMock).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('schedules no follow-up work when persistence fails and state remains absent, leaving the prepared release cache untouched', async () => {
      // Covers the state-loss persistence-failure scenario: state stays
      // absent even after finalization, but that no longer schedules any
      // deletion of the release this attempt prepared — it remains reusable
      // by a later retry.
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      writeControllerStateMock.mockRejectedValue(new Error('quota exceeded'));
      const coordinator = createPreparationCoordinator();
      const postMessage = vi.fn();
      matchAllMock.mockResolvedValue([
        { type: 'window', url: `${CHANNEL_ORIGIN}/settings`, postMessage },
      ]);
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({
        protocolVersion: PROTOCOL_VERSION,
        result: 'controller-state-persistence-failed',
      });
      expect(result.runLifetimeWork).toBeUndefined();
      expect(cachesDeleteMock).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('a rejecting cleanup never replaces or throws past the already-classified response', async () => {
      readControllerStateMock.mockResolvedValue({ status: 'absent' });
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      const coordinator = createFakeCoordinator({
        runCleanup: vi.fn().mockRejectedValue(new Error('cleanup failed')),
      });
      const { handleWorkerMessage } = await import('./workerMessages');

      const result = await handleWorkerMessage(
        'stable',
        '/',
        CHANNEL_ORIGIN,
        { protocolVersion: PROTOCOL_VERSION, type: 'RECOVER_INSTALL_LATEST' },
        enqueue,
        coordinator,
        createFakeReconciler(),
      );

      expect(result.response).toEqual({ protocolVersion: PROTOCOL_VERSION, result: 'success' });
      expect(result.runLifetimeWork).toBeTypeOf('function');
      await expect(result.runLifetimeWork?.()).resolves.toBeUndefined();
    });

    it('two concurrent recovery callers sharing one preparation: a failed finalization schedules no cleanup, leaving the shared cache intact for the sibling that persists state referencing it', async () => {
      // Both callers discover and prepare the exact same latest release B,
      // joining one real PreparationCoordinator preparation (the coordinator
      // stops tracking it as in-flight the moment that shared preparation
      // settles, for both callers at once). Whichever finalizes first hits a
      // transient persistence failure; with `preparedTargetToCleanup` gone,
      // that failure schedules no follow-up work at all, so it can never
      // race the sibling — still finalizing behind it in the same real
      // OperationQueue — which then successfully persists state referencing
      // that exact release. The shared prepared cache must survive both
      // outcomes and end up protected as the now-active release.
      let persistedState: { status: 'absent' } | { status: 'valid'; state: UpdateControllerState } =
        { status: 'absent' };
      readControllerStateMock.mockImplementation(() => Promise.resolve(persistedState));
      let writeAttempts = 0;
      writeControllerStateMock.mockImplementation(
        (_channel: string, state: UpdateControllerState) => {
          writeAttempts += 1;
          if (writeAttempts === 1) return Promise.reject(new Error('transient quota error'));
          persistedState = { status: 'valid', state };
          return Promise.resolve(undefined);
        },
      );
      fetchLatestReleasePointerMock.mockResolvedValue({ releaseNumber: releaseB.releaseNumber });
      fetchReleaseDescriptorMock.mockResolvedValue(descriptorFor(releaseB));
      cachesKeysMock.mockResolvedValue([`stable-release-${releaseB.releaseNumber}`]);
      const coordinator = createPreparationCoordinator();
      const realEnqueue = createOperationQueue();
      const { handleWorkerMessage } = await import('./workerMessages');

      const request = {
        protocolVersion: PROTOCOL_VERSION,
        type: 'RECOVER_INSTALL_LATEST',
      } as const;
      const [resultA, resultB] = await Promise.all([
        handleWorkerMessage(
          'stable',
          '/',
          CHANNEL_ORIGIN,
          request,
          realEnqueue,
          coordinator,
          createFakeReconciler(),
        ),
        handleWorkerMessage(
          'stable',
          '/',
          CHANNEL_ORIGIN,
          request,
          realEnqueue,
          coordinator,
          createFakeReconciler(),
        ),
      ]);

      const results = [resultA, resultB];
      const responseResult = (result: (typeof results)[number]): unknown =>
        'result' in result.response ? result.response.result : undefined;
      const failed = results.find(
        (result) => responseResult(result) === 'controller-state-persistence-failed',
      );
      const succeeded = results.find((result) => responseResult(result) === 'success');
      expect(failed).toBeDefined();
      expect(succeeded).toBeDefined();
      // No cache deletion can ever be scheduled by the failed caller: an
      // unsuccessful finalization carries no follow-up work at all.
      expect(failed?.runLifetimeWork).toBeUndefined();

      await succeeded?.runLifetimeWork?.();

      expect(cachesDeleteMock).not.toHaveBeenCalledWith(`stable-release-${releaseB.releaseNumber}`);
    });
  });
});
