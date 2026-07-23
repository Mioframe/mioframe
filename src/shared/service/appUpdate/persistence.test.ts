import { describe, expect, it } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import { createMemoryReleaseControllerStateStore } from './persistence';
import { createInitialReleaseControllerState } from './stateMachine';

const current: ReleaseIdentity = {
  releaseId: 'a'.repeat(40),
  releaseSequence: 3,
  appVersion: '1.0.0',
  buildId: 'aaaaaaa',
  buildDate: '2026-07-23T00:00:00.000Z',
};

describe('release persistence recovery', () => {
  it('initializes only an absent record as a fresh Automatic state', async () => {
    const read = await createMemoryReleaseControllerStateStore().read(current);
    expect(read).toMatchObject({
      capability: 'available',
      state: { mode: 'automatic', activeRelease: current },
    });
  });

  it('never throws: an unsupported newer schema stays untouched and reports capability unavailable', async () => {
    const store = createMemoryReleaseControllerStateStore({ schemaVersion: 99 });
    const read = await store.read(current);
    expect(read.capability).toBe('unavailable');
    expect(read.state).toMatchObject({ mode: 'automatic', activeRelease: current });
    expect(store.current()).toEqual({ schemaVersion: 99 });
  });

  it('recovers malformed current from last-known-good without losing a Manual pin', async () => {
    const manual = {
      ...createInitialReleaseControllerState(current),
      mode: 'manual' as const,
      pinnedRelease: current,
    };
    const store = createMemoryReleaseControllerStateStore({ malformed: true }, manual);
    const read = await store.read(current);
    expect(read).toMatchObject({
      capability: 'available',
      state: { mode: 'manual', pinnedRelease: current },
    });
  });

  it('never throws and never silently changes mode when neither record recovers', async () => {
    const store = createMemoryReleaseControllerStateStore(
      { malformed: true },
      { alsoMalformed: true },
    );
    const read = await store.read(current);
    expect(read).toMatchObject({
      capability: 'unavailable',
      state: { mode: 'automatic', activeRelease: current },
    });
  });
});
