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
  it('initializes only an absent record and preserves a supported Manual pin migration', async () => {
    await expect(createMemoryReleaseControllerStateStore().read(current)).resolves.toMatchObject({
      mode: 'automatic',
      activeRelease: current,
    });
    const legacy = {
      schemaVersion: 1,
      mode: 'manual',
      activeRelease: current,
      pinnedRelease: current,
    };
    await expect(
      createMemoryReleaseControllerStateStore(legacy).read(current),
    ).resolves.toMatchObject({
      mode: 'manual',
      pinnedRelease: current,
    });
  });

  it('does not overwrite unsupported state and recovers malformed current from last-known-good', async () => {
    const unsupported = createMemoryReleaseControllerStateStore({ schemaVersion: 99 });
    await expect(unsupported.read(current)).rejects.toMatchObject({
      reason: 'unsupportedSchema',
    });
    expect(unsupported.current()).toEqual({ schemaVersion: 99 });

    const manual = {
      ...createInitialReleaseControllerState(current),
      mode: 'manual' as const,
      pinnedRelease: current,
    };
    const recovered = createMemoryReleaseControllerStateStore({ malformed: true }, manual);
    await expect(recovered.read(current)).resolves.toMatchObject({
      mode: 'manual',
      pinnedRelease: current,
    });
  });
});
