import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LatestRelease, ReleaseIdentity } from './contracts';
import { createReleaseController } from './controller';
import { createMemoryReleaseControllerStateStore } from './persistence';
import { fetchValidatedReleaseMetadata, isReleaseAvailable, prepareRelease } from './releaseCache';

vi.mock('./releaseCache', () => ({
  fetchValidatedReleaseMetadata: vi.fn(),
  isReleaseAvailable: vi.fn(),
  prepareRelease: vi.fn(),
}));

const current: ReleaseIdentity = {
  releaseId: 'a'.repeat(40),
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: 'aaaaaaa',
  buildDate: '2026-07-23T00:00:00.000Z',
};
const next: ReleaseIdentity = {
  releaseId: 'b'.repeat(40),
  releaseSequence: 2,
  appVersion: '1.0.0',
  buildId: 'bbbbbbb',
  buildDate: '2026-07-24T00:00:00.000Z',
};
const latest: LatestRelease = {
  schemaVersion: 2,
  release: next,
  descriptorUrl: `/updates/releases/${next.releaseId}.json`,
};
const descriptor = {
  schemaVersion: 2 as const,
  ...next,
  indexUrl: `/updates/releases/${next.releaseId}/index.html`,
  files: [
    {
      url: `/updates/releases/${next.releaseId}/index.html`,
      byteSize: 1,
      sha256: 'c'.repeat(64),
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(fetchValidatedReleaseMetadata).mockReset();
  vi.mocked(isReleaseAvailable).mockReset();
  vi.mocked(prepareRelease).mockReset();
});

describe('background release controller operations', () => {
  it('acknowledges a check after persisting checking and completes through snapshot state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(latest))));
    vi.mocked(fetchValidatedReleaseMetadata).mockResolvedValue({ latest, descriptor });
    vi.mocked(isReleaseAvailable).mockResolvedValue(false);
    const store = createMemoryReleaseControllerStateStore();
    const snapshots: string[] = [];
    const controller = createReleaseController({
      currentRelease: current,
      store,
      now: () => new Date('2026-07-25T00:00:00.000Z'),
      operationId: () => 'operation',
      publish: (state) => snapshots.push(`${state.checkState}:${state.preparationState}`),
    });
    const execution = await controller.execute({ protocolVersion: 2, type: 'CHECK_FOR_UPDATES' });
    expect(execution.response).toEqual({ kind: 'action', result: { status: 'accepted' } });
    expect((await store.read(current)).checkState).toBe('checking');
    expect(prepareRelease).not.toHaveBeenCalled();
    await execution.background?.();
    expect(await store.read(current)).toMatchObject({
      checkState: 'succeeded',
      preparationState: 'ready',
      preparedRelease: next,
    });
    expect(snapshots).toContain('checking:idle');
    expect(snapshots).toContain('succeeded:preparing');
  });

  it('does not prepare an equal or stale release and cancels preparation eligibility on Manual mode', async () => {
    const equal = { ...latest, release: { ...current, releaseId: 'c'.repeat(40) } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(equal))));
    vi.mocked(fetchValidatedReleaseMetadata).mockResolvedValue({
      latest: equal,
      descriptor: { ...descriptor, ...equal.release },
    });
    const store = createMemoryReleaseControllerStateStore();
    const controller = createReleaseController({ currentRelease: current, store });
    const check = await controller.execute({ protocolVersion: 2, type: 'CHECK_FOR_UPDATES' });
    await check.background?.();
    expect(prepareRelease).not.toHaveBeenCalled();

    await store.write({
      ...(await store.read(current)),
      confirmedLatestRelease: next,
      preparationState: 'preparing',
      preparationOperationId: 'old',
    });
    await controller.execute({ protocolVersion: 2, type: 'SET_MODE', mode: 'manual' });
    expect(await store.read(current)).toMatchObject({
      mode: 'manual',
      pinnedRelease: current,
      preparationState: 'idle',
    });
  });
});
