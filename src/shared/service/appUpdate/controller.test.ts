import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import { createReleaseController } from './controller';
import { createMemoryReleaseControllerStateStore } from './persistence';
import { isReleaseAvailable, prepareRelease } from './releaseCache';

vi.mock('./releaseCache', () => ({
  isReleaseAvailable: vi.fn(),
  prepareRelease: vi.fn(),
}));

const current: ReleaseIdentity = {
  releaseId: 'a'.repeat(40),
  appVersion: '1.0.0',
  buildId: 'aaaaaaa',
  buildDate: '2026-07-23T00:00:00.000Z',
};

const latest: ReleaseIdentity = {
  releaseId: 'b'.repeat(40),
  appVersion: '1.0.0',
  buildId: 'bbbbbbb',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const latestResponse = () =>
  new Response(
    JSON.stringify({
      schemaVersion: 1,
      release: latest,
      descriptorUrl: `/updates/releases/${latest.releaseId}.json`,
    }),
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(isReleaseAvailable).mockReset();
  vi.mocked(prepareRelease).mockReset();
});

describe('release controller protocol', () => {
  it('rejects an unsupported protocol version without changing state', async () => {
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(await controller.execute({ protocolVersion: 2, type: 'GET_STATE' })).toEqual({
      status: 'error',
      code: 'unsupportedProtocol',
    });
    expect((await store.read(current)).activeRelease).toEqual(current);
  });

  it('reports a failed check factually while retaining the running mode and version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(await controller.execute({ protocolVersion: 1, type: 'CHECK' })).toMatchObject({
      status: 'error',
      code: 'checkFailed',
      state: { mode: 'automatic', activeRelease: current },
    });
  });

  it('validates malformed commands and returns the persisted state', async () => {
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(await controller.execute({ type: 'GET_STATE' })).toEqual({
      status: 'error',
      code: 'invalidResponse',
    });
    expect(await controller.execute({ protocolVersion: 1, type: 'GET_STATE' })).toEqual({
      status: 'ok',
      state: expect.objectContaining({ activeRelease: current, mode: 'automatic' }),
    });
  });

  it('checks and prepares a confirmed release in Automatic mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(latestResponse()));
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => '2026-07-25T00:00:00.000Z',
    });
    const outcome = await controller.execute({ protocolVersion: 1, type: 'CHECK' });
    expect(prepareRelease).toHaveBeenCalledWith(latest);
    expect(outcome).toMatchObject({
      status: 'ok',
      state: {
        confirmedLatestRelease: latest,
        candidateRelease: latest,
        lastSuccessfulCheckAt: '2026-07-25T00:00:00.000Z',
      },
    });
  });

  it('checks metadata without preparing while in Manual mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(latestResponse()));
    const store = createMemoryReleaseControllerStateStore();
    await store.write({
      schemaVersion: 1,
      mode: 'manual',
      activeRelease: current,
      pinnedRelease: current,
    });
    const controller = createReleaseController({ currentRelease: current, store });
    const outcome = await controller.execute({ protocolVersion: 1, type: 'CHECK' });
    expect(prepareRelease).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      status: 'ok',
      state: { mode: 'manual', confirmedLatestRelease: latest },
    });
  });

  it('does not prepare without a supported latest release or after automatic failure', async () => {
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(await controller.execute({ protocolVersion: 1, type: 'PREPARE_LATEST' })).toMatchObject({
      status: 'ok',
      state: { activeRelease: current },
    });
    await store.write({
      schemaVersion: 1,
      mode: 'automatic',
      activeRelease: current,
      confirmedLatestRelease: latest,
      failedReleaseId: latest.releaseId,
    });
    await controller.execute({ protocolVersion: 1, type: 'PREPARE_LATEST' });
    expect(prepareRelease).not.toHaveBeenCalled();
  });

  it('requires complete running-release availability before changing mode', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(
      await controller.execute({
        protocolVersion: 1,
        type: 'SET_AUTOMATIC',
        enabled: false,
        runningReleaseId: current.releaseId,
      }),
    ).toMatchObject({ status: 'error', code: 'prepareFailed' });
    expect((await store.read(current)).mode).toBe('automatic');
  });

  it('pins Manual and prepares latest when Automatic is restored', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore();
    await store.write({
      schemaVersion: 1,
      mode: 'automatic',
      activeRelease: current,
      confirmedLatestRelease: latest,
      candidateRelease: latest,
    });
    const controller = createReleaseController({ currentRelease: current, store });
    const manual = await controller.execute({
      protocolVersion: 1,
      type: 'SET_AUTOMATIC',
      enabled: false,
      runningReleaseId: current.releaseId,
    });
    expect(manual).toMatchObject({
      status: 'ok',
      state: { mode: 'manual', pinnedRelease: current, candidateRelease: undefined },
    });
    const automatic = await controller.execute({
      protocolVersion: 1,
      type: 'SET_AUTOMATIC',
      enabled: true,
      runningReleaseId: current.releaseId,
    });
    expect(prepareRelease).toHaveBeenCalledWith(latest);
    expect(automatic).toMatchObject({
      status: 'ok',
      state: { mode: 'automatic', pinnedRelease: undefined, candidateRelease: latest },
    });
  });

  it.each([
    ['busy', 'restartBusy'],
    ['unresponsive', 'restartUnresponsive'],
  ] as const)('blocks activation when restart readiness is %s', async (readiness, code) => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(true);
    const store = createMemoryReleaseControllerStateStore();
    await store.write({
      schemaVersion: 1,
      mode: 'automatic',
      activeRelease: current,
      confirmedLatestRelease: latest,
      candidateRelease: latest,
    });
    const controller = createReleaseController({
      currentRelease: current,
      store,
      readiness: () => Promise.resolve(readiness),
    });
    expect(await controller.execute({ protocolVersion: 1, type: 'ACTIVATE' })).toMatchObject({
      status: 'blocked',
      code,
      state: { activeRelease: current, candidateRelease: latest },
    });
  });

  it('prepares, starts, and confirms an explicit activation trial', async () => {
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    const store = createMemoryReleaseControllerStateStore();
    await store.write({
      schemaVersion: 1,
      mode: 'manual',
      activeRelease: current,
      pinnedRelease: current,
      confirmedLatestRelease: latest,
    });
    const controller = createReleaseController({ currentRelease: current, store });
    const activation = await controller.execute({ protocolVersion: 1, type: 'ACTIVATE' });
    expect(prepareRelease).toHaveBeenCalledWith(latest);
    expect(activation).toMatchObject({
      status: 'ok',
      state: { previousRelease: current, bootAttempt: latest, candidateRelease: undefined },
    });
    expect(
      await controller.execute({
        protocolVersion: 1,
        type: 'BOOT_OK',
        releaseId: latest.releaseId,
      }),
    ).toMatchObject({
      status: 'ok',
      state: { activeRelease: latest, pinnedRelease: latest, bootAttempt: undefined },
    });
  });

  it('requires confirmed metadata before activation', async () => {
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    expect(await controller.execute({ protocolVersion: 1, type: 'ACTIVATE' })).toMatchObject({
      status: 'error',
      code: 'checkFailed',
      state: { activeRelease: current },
    });
  });
});
