import { describe, expect, it } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import {
  createInitialReleaseControllerState,
  isStrictlyNewerRelease,
  migrateReleaseControllerState,
  projectAppUpdateSnapshot,
} from './stateMachine';

const release = (letter: string, releaseSequence: number): ReleaseIdentity => ({
  releaseId: letter.repeat(40),
  releaseSequence,
  appVersion: '1.0.0',
  buildId: letter.repeat(7),
  buildDate: '2026-07-23T00:00:00.000Z',
});

describe('release controller state', () => {
  it('orders releases only by publisher sequence', () => {
    const running = release('b', 2);
    expect(isStrictlyNewerRelease(release('a', 1), running)).toBe(false);
    expect(isStrictlyNewerRelease(release('c', 2), running)).toBe(false);
    expect(isStrictlyNewerRelease(release('a', 3), running)).toBe(true);
  });

  it('migrates a supported same-release Manual pin without resetting its mode', () => {
    const current = release('a', 4);
    expect(
      migrateReleaseControllerState(
        { schemaVersion: 1, mode: 'manual', activeRelease: current, pinnedRelease: current },
        current,
      ),
    ).toMatchObject({ schemaVersion: 2, mode: 'manual', pinnedRelease: current });
    expect(
      migrateReleaseControllerState(
        {
          schemaVersion: 1,
          mode: 'manual',
          activeRelease: current,
          pinnedRelease: release('b', 3),
        },
        current,
      ),
    ).toBeUndefined();
  });

  it('projects only UI-safe facts', () => {
    const current = release('a', 1);
    const state = {
      ...createInitialReleaseControllerState(current),
      preparedRelease: release('b', 2),
      preparationState: 'ready' as const,
      checkOperationId: 'private-check',
    };
    const snapshot = projectAppUpdateSnapshot(state);
    expect(snapshot).toMatchObject({ runningRelease: current, preparationState: 'ready' });
    expect(snapshot).not.toHaveProperty('preparedRelease');
    expect(snapshot).not.toHaveProperty('checkOperationId');
    expect(snapshot).not.toHaveProperty('activationTransaction');
  });
});
