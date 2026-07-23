import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LatestRelease, ReleaseControllerState, ReleaseIdentity } from './contracts';
import { createReleaseController } from './controller';
import { createMemoryReleaseControllerStateStore } from './persistence';
import {
  cleanupStaleStagingCaches,
  fetchValidatedReleaseMetadata,
  isReleaseAvailable,
  prepareRelease,
} from './releaseCache';
import { createInitialReleaseControllerState } from './stateMachine';
import { associateTrialNavigation } from './trial';

vi.mock('./releaseCache', () => ({
  cleanupStaleStagingCaches: vi.fn().mockResolvedValue(undefined),
  fetchValidatedReleaseMetadata: vi.fn(),
  isReleaseAvailable: vi.fn(),
  prepareRelease: vi.fn(),
}));

const release = (letter: string, releaseSequence: number): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-24T00:00:00.000Z',
});

const current = release('a', 1);
const next = release('b', 2);
const latestNext: LatestRelease = {
  schemaVersion: 2,
  release: next,
  descriptorUrl: `/updates/releases/${next.releaseId}.json`,
};
const descriptorFor = (identity: ReleaseIdentity) => ({
  schemaVersion: 2 as const,
  ...identity,
  indexUrl: `/updates/releases/${identity.releaseId}/index.html`,
  files: [
    {
      url: `/updates/releases/${identity.releaseId}/index.html`,
      byteSize: 1,
      sha256: 'c'.repeat(64),
    },
  ],
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(fetchValidatedReleaseMetadata).mockReset();
  vi.mocked(isReleaseAvailable).mockReset();
  vi.mocked(prepareRelease).mockReset();
  vi.mocked(cleanupStaleStagingCaches).mockClear();
});

describe('background check and preparation', () => {
  it('acknowledges a check after persisting a running operation and completes through snapshot state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(latestNext))));
    vi.mocked(fetchValidatedReleaseMetadata).mockResolvedValue({
      latest: latestNext,
      descriptor: descriptorFor(next),
    });
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    const store = createMemoryReleaseControllerStateStore();
    const snapshots: string[] = [];
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
      operationId: () => 'operation',
      publish: (state) => snapshots.push(`${state.check.status}:${state.preparation.status}`),
    });
    const execution = await controller.execute({ protocolVersion: 3, type: 'CHECK_FOR_UPDATES' });
    expect(execution.response).toEqual({ kind: 'action', result: { status: 'accepted' } });
    expect((await store.read(current)).state.check).toMatchObject({ status: 'running' });
    expect(prepareRelease).not.toHaveBeenCalled();
    await execution.background?.();
    expect((await store.read(current)).state).toMatchObject({
      check: { status: 'idle' },
      preparation: { status: 'ready', release: next },
      latestRelease: next,
    });
    expect(snapshots).toContain('running:idle');
    expect(snapshots).toContain('idle:running');
  });

  it('does not prepare an equal or stale release and cancels preparation on switching to Manual', async () => {
    const equal: LatestRelease = {
      ...latestNext,
      release: { ...current, releaseId: 'c'.repeat(40) },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(equal))));
    vi.mocked(fetchValidatedReleaseMetadata).mockResolvedValue({
      latest: equal,
      descriptor: descriptorFor(equal.release),
    });
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({
      currentRelease: current,
      store,
      operationId: () => 'operation',
    });
    const check = await controller.execute({ protocolVersion: 3, type: 'CHECK_FOR_UPDATES' });
    await check.background?.();
    expect(prepareRelease).not.toHaveBeenCalled();

    await store.write({
      ...(await store.read(current)).state,
      latestRelease: next,
      preparation: {
        status: 'running',
        release: next,
        operationId: 'stale',
        startedAt: '2026-07-24T00:00:00.000Z',
      },
    });
    await controller.execute({ protocolVersion: 3, type: 'SET_MODE', mode: 'manual' });
    expect((await store.read(current)).state).toMatchObject({
      mode: 'manual',
      pinnedRelease: current,
      preparation: { status: 'idle' },
    });
  });

  it('does not let a stale B preparation completion override state after latest advances to C', async () => {
    const c = release('c', 3);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(latestNext))));
    vi.mocked(fetchValidatedReleaseMetadata).mockResolvedValue({
      latest: latestNext,
      descriptor: descriptorFor(next),
    });
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    let resolvePrepare: (() => void) | undefined;
    let notifyPrepareStarted: (() => void) | undefined;
    const prepareStarted = new Promise<void>((resolve) => {
      notifyPrepareStarted = resolve;
    });
    const prepareGate = new Promise<void>((resolve) => {
      resolvePrepare = resolve;
    });
    vi.mocked(prepareRelease).mockImplementation(async () => {
      notifyPrepareStarted?.();
      await prepareGate;
      return descriptorFor(next);
    });
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({
      currentRelease: current,
      store,
      operationId: () => 'op-b',
    });
    const check = await controller.execute({ protocolVersion: 3, type: 'CHECK_FOR_UPDATES' });
    const background = check.background?.();

    // Wait until B's preparation has actually started (so its "running" write already landed)
    // before simulating that a fresh check has, in the meantime, advanced latest to C.
    await prepareStarted;
    const mid = await store.read(current);
    await store.write({
      ...mid.state,
      latestRelease: c,
      preparation: {
        status: 'running',
        release: c,
        operationId: 'op-c',
        startedAt: '2026-07-24T00:00:00.000Z',
      },
    });
    resolvePrepare?.();
    await background;

    expect((await store.read(current)).state.preparation).toEqual({
      status: 'running',
      release: c,
      operationId: 'op-c',
      startedAt: '2026-07-24T00:00:00.000Z',
    });
  });
});

describe('interrupted operation reconciliation', () => {
  it('resets a stale running check to idle, preserving its last success, and allows a future check', async () => {
    const staleState: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      check: {
        status: 'running',
        operationId: 'abandoned',
        startedAt: '2020-01-01T00:00:00.000Z',
        lastSuccessAt: '2019-01-01T00:00:00.000Z',
      },
    };
    const store = createMemoryReleaseControllerStateStore(staleState);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
    });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    expect((await store.read(current)).state.check).toEqual({
      status: 'idle',
      lastSuccessAt: '2019-01-01T00:00:00.000Z',
    });
  });

  it('converts a stale running preparation to ready when its cache already completed', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const staleState: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: next,
      preparation: {
        status: 'running',
        release: next,
        operationId: 'abandoned',
        startedAt: '2020-01-01T00:00:00.000Z',
      },
    };
    const store = createMemoryReleaseControllerStateStore(staleState);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
    });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    expect((await store.read(current)).state.preparation).toEqual({
      status: 'ready',
      release: next,
    });
  });

  it('idles a stale running preparation that never finished caching', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    const staleState: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: next,
      preparation: {
        status: 'running',
        release: next,
        operationId: 'abandoned',
        startedAt: '2020-01-01T00:00:00.000Z',
      },
    };
    const store = createMemoryReleaseControllerStateStore(staleState);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
    });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    expect((await store.read(current)).state.preparation).toEqual({ status: 'idle' });
  });

  it('deletes stale staging caches once at startup', async () => {
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    expect(cleanupStaleStagingCaches).toHaveBeenCalledTimes(1);
  });
});

describe('single-window trial via Manual Update now', () => {
  const readyState = (): ReleaseControllerState => ({
    ...createInitialReleaseControllerState(current),
    mode: 'manual',
    pinnedRelease: current,
    latestRelease: next,
    preparation: { status: 'ready', release: next },
  });

  it('starts exactly one trial and rejects a second window while it is in progress', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore(readyState());
    const onTrialStarted = vi.fn().mockResolvedValue(undefined);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }]),
      onTrialStarted,
    });
    const execution = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(execution.response).toEqual({ kind: 'action', result: { status: 'accepted' } });
    await execution.background?.();
    expect(onTrialStarted).toHaveBeenCalledTimes(1);
    const trialAfterStart = (await store.read(current)).state.trial;
    expect(trialAfterStart).toMatchObject({ targetRelease: next, previousRelease: current });

    const repeat = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(repeat.response).toEqual({ kind: 'action', result: { status: 'accepted' } });
    expect(repeat.background).toBeUndefined();
    expect((await store.read(current)).state.trial).toEqual(trialAfterStart);
    expect(onTrialStarted).toHaveBeenCalledTimes(1);
  });

  it('does not mistake the requesting window reloading into the trial for a failed retry', async () => {
    // Regression: `initiatingClientId` must stay unset when a Manual trial is created, naming only
    // the requesting (pre-reload) client for the reload command. If the trial recorded that client
    // id as already "claimed", the requester's own reload -- which necessarily arrives under a
    // brand-new client id -- would be misread as a second, failed attempt and rolled back
    // immediately instead of being served the trial target.
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore(readyState());
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester-old' }]),
    });
    const execution = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester-old',
    );
    await execution.background?.();
    const started = (await store.read(current)).state;
    expect(started.trial?.initiatingClientId).toBeUndefined();

    const claimed = associateTrialNavigation(started, 'requester-new-after-reload');
    expect(claimed.trial).toMatchObject({
      targetRelease: next,
      initiatingClientId: 'requester-new-after-reload',
    });
    expect(claimed.activeRelease).toEqual(current);
  });

  it('rejects Update now when VFS work is active, before counting windows', async () => {
    const store = createMemoryReleaseControllerStateStore(readyState());
    const controller = createReleaseController({
      currentRelease: current,
      store,
      vfsReadiness: () => Promise.resolve(false),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }, { id: 'other' }]),
    });
    const execution = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(execution.response).toEqual({
      kind: 'action',
      result: { status: 'blocked', code: 'blockedByActivity' },
    });
  });

  it('rejects Update now while another registered stable window is open', async () => {
    const store = createMemoryReleaseControllerStateStore(readyState());
    const controller = createReleaseController({
      currentRelease: current,
      store,
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }, { id: 'other' }]),
    });
    const execution = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(execution.response).toEqual({
      kind: 'action',
      result: { status: 'blocked', code: 'blockedByOtherWindows' },
    });
  });

  it('does not replace an active trial on a mode change, only its own mode/pin bookkeeping', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore(readyState());
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }]),
    });
    const update = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    await update.background?.();
    const trialBefore = (await store.read(current)).state.trial;

    await controller.execute({ protocolVersion: 3, type: 'SET_MODE', mode: 'automatic' });
    const after = (await store.read(current)).state;
    expect(after.mode).toBe('automatic');
    expect(after.trial).toEqual(trialBefore);
    expect(after.preparation).toEqual({ status: 'ready', release: next });
  });
});

describe('failed trial and failed-target eligibility', () => {
  it('rolls back an expired trial, marks its target failed, and never retries that target automatically', async () => {
    const state: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: next,
      preparation: { status: 'ready', release: next },
      trial: {
        targetRelease: next,
        previousRelease: current,
        startedAt: '2026-07-24T00:00:00.000Z',
        expiresAt: '2026-07-24T00:01:00.000Z',
      },
    };
    const store = createMemoryReleaseControllerStateStore(state);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-24T00:02:00.000Z'),
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }]),
    });
    await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    const rolledBack = (await store.read(current)).state;
    expect(rolledBack.trial).toBeUndefined();
    expect(rolledBack.activeRelease).toEqual(current);
    expect(rolledBack.failedReleaseIds).toEqual([next.releaseId]);

    const retry = await controller.execute({ protocolVersion: 3, type: 'UPDATE_NOW' }, 'requester');
    expect(retry.response).toEqual({
      kind: 'action',
      result: { status: 'error', code: 'checkFailed' },
    });
  });

  it('keeps a strictly newer release id eligible after an older target already failed', async () => {
    const c = release('c', 3);
    const state: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: c,
      failedReleaseIds: [next.releaseId],
      preparation: { status: 'idle' },
    };
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore(state);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      vfsReadiness: () => Promise.resolve(true),
      registeredStableWindows: () => Promise.resolve([{ id: 'requester' }]),
    });
    const execution = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(execution.response).toEqual({ kind: 'action', result: { status: 'accepted' } });
    await execution.background?.();
    expect((await store.read(current)).state.preparation).toEqual({ status: 'ready', release: c });
  });

  it('commits a trial only when the confirming release matches its target', async () => {
    const state: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: next,
      preparation: { status: 'idle' },
      trial: {
        targetRelease: next,
        previousRelease: current,
        startedAt: '2026-07-24T00:00:00.000Z',
        expiresAt: '2026-07-25T00:00:00.000Z',
        initiatingClientId: 'requester',
      },
    };
    const store = createMemoryReleaseControllerStateStore(state);
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-24T00:00:30.000Z'),
    });
    await controller.execute(
      { protocolVersion: 3, type: 'PRIVATE_BOOT_READY', releaseId: current.releaseId },
      'requester',
    );
    expect((await store.read(current)).state.trial).toBeDefined();

    await controller.execute(
      { protocolVersion: 3, type: 'PRIVATE_BOOT_READY', releaseId: next.releaseId },
      'requester',
    );
    const committed = (await store.read(current)).state;
    expect(committed.trial).toBeUndefined();
    expect(committed.activeRelease).toEqual(next);
  });
});

describe('persistence unavailable', () => {
  const unavailableStore = {
    read: () =>
      Promise.resolve({
        state: createInitialReleaseControllerState(current),
        capability: 'unavailable' as const,
      }),
    write: vi.fn().mockResolvedValue(undefined),
  };

  it('reports capability unavailable and never checks, prepares, or writes', async () => {
    unavailableStore.write.mockClear();
    const controller = createReleaseController({
      currentRelease: current,
      store: unavailableStore,
    });
    const snapshot = await controller.execute({ protocolVersion: 3, type: 'GET_SNAPSHOT' });
    expect(snapshot.response).toMatchObject({
      kind: 'snapshot',
      snapshot: { capability: 'unavailable' },
    });

    const check = await controller.execute({ protocolVersion: 3, type: 'CHECK_FOR_UPDATES' });
    expect(check.response).toEqual({
      kind: 'action',
      result: { status: 'error', code: 'capabilityUnavailable' },
    });
    const update = await controller.execute(
      { protocolVersion: 3, type: 'UPDATE_NOW' },
      'requester',
    );
    expect(update.response).toEqual({
      kind: 'action',
      result: { status: 'error', code: 'capabilityUnavailable' },
    });
    expect(unavailableStore.write).not.toHaveBeenCalled();
  });
});
