import { describe, expect, it } from 'vitest';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import {
  committedRelease,
  createInitialReleaseControllerState,
  isStrictlyNewerRelease,
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
    expect(isStrictlyNewerRelease(undefined, running)).toBe(false);
  });

  it('creates a fresh Automatic state naming no check or preparation activity', () => {
    const current = release('a', 1);
    expect(createInitialReleaseControllerState(current)).toEqual({
      schemaVersion: 3,
      mode: 'automatic',
      activeRelease: current,
      failedReleaseIds: [],
      check: { status: 'idle' },
      preparation: { status: 'idle' },
    });
  });

  it('serves the Manual pin over the active release, and the active release otherwise', () => {
    const active = release('a', 1);
    const pinned = release('b', 2);
    expect(
      committedRelease({
        ...createInitialReleaseControllerState(active),
        mode: 'manual',
        pinnedRelease: pinned,
      }),
    ).toEqual(pinned);
    expect(committedRelease(createInitialReleaseControllerState(active))).toEqual(active);
  });

  it('projects only UI-safe facts and never the private state shape', () => {
    const current = release('a', 1);
    const target = release('b', 2);
    const state: ReleaseControllerState = {
      ...createInitialReleaseControllerState(current),
      latestRelease: target,
      preparation: { status: 'ready', release: target },
    };
    const snapshot = projectAppUpdateSnapshot(state);
    expect(snapshot).toEqual({
      capability: 'available',
      mode: 'automatic',
      runningRelease: current,
      latestRelease: target,
      updateState: 'ready',
    });
    expect(snapshot).not.toHaveProperty('preparation');
    expect(snapshot).not.toHaveProperty('trial');
    expect(snapshot).not.toHaveProperty('failedReleaseIds');
    expect(snapshot).not.toHaveProperty('check');
  });

  it('reports capability unavailable as given, independent of state contents', () => {
    const current = release('a', 1);
    const snapshot = projectAppUpdateSnapshot(
      createInitialReleaseControllerState(current),
      'unavailable',
    );
    expect(snapshot.capability).toBe('unavailable');
  });

  describe('updateState precedence', () => {
    const current = release('a', 1);
    const target = release('b', 2);
    const base = createInitialReleaseControllerState(current);

    it('is trialStarting whenever a trial is in progress, ahead of any other fact', () => {
      const state: ReleaseControllerState = {
        ...base,
        latestRelease: target,
        preparation: { status: 'failed', release: target },
        trial: {
          targetRelease: target,
          previousRelease: current,
          startedAt: '2026-07-23T00:00:00.000Z',
          expiresAt: '2026-07-23T00:01:00.000Z',
        },
      };
      expect(projectAppUpdateSnapshot(state).updateState).toBe('trialStarting');
    });

    it('is preparing while preparation runs', () => {
      const state: ReleaseControllerState = {
        ...base,
        latestRelease: target,
        preparation: {
          status: 'running',
          release: target,
          operationId: 'op',
          startedAt: '2026-07-23T00:00:00.000Z',
        },
      };
      expect(projectAppUpdateSnapshot(state).updateState).toBe('preparing');
    });

    it('is ready only while the ready target is still newer than the served release', () => {
      const ready: ReleaseControllerState = {
        ...base,
        latestRelease: target,
        preparation: { status: 'ready', release: target },
      };
      expect(projectAppUpdateSnapshot(ready).updateState).toBe('ready');
      const staleReady: ReleaseControllerState = { ...ready, activeRelease: target };
      expect(projectAppUpdateSnapshot(staleReady).updateState).not.toBe('ready');
    });

    it('is failed after a failed preparation or a failed check', () => {
      expect(
        projectAppUpdateSnapshot({
          ...base,
          latestRelease: target,
          preparation: { status: 'failed', release: target },
        }).updateState,
      ).toBe('failed');
      expect(projectAppUpdateSnapshot({ ...base, check: { status: 'failed' } }).updateState).toBe(
        'failed',
      );
    });

    it('is checking while a check runs', () => {
      expect(
        projectAppUpdateSnapshot({
          ...base,
          check: { status: 'running', operationId: 'op', startedAt: '2026-07-23T00:00:00.000Z' },
        }).updateState,
      ).toBe('checking');
    });

    it('is available once a strictly newer latest release is known', () => {
      expect(
        projectAppUpdateSnapshot({
          ...base,
          latestRelease: target,
          check: { status: 'idle', lastSuccessAt: '2026-07-23T00:00:00.000Z' },
        }).updateState,
      ).toBe('available');
    });

    it('is notChecked before any successful check and upToDate after one with nothing newer', () => {
      expect(projectAppUpdateSnapshot(base).updateState).toBe('notChecked');
      expect(
        projectAppUpdateSnapshot({
          ...base,
          check: { status: 'idle', lastSuccessAt: '2026-07-23T00:00:00.000Z' },
        }).updateState,
      ).toBe('upToDate');
    });
  });

  describe('target-aware preparation projection once latest advances past a stale target', () => {
    const current = release('a', 1);
    const b = release('b', 2);
    const c = release('c', 3);
    const base = createInitialReleaseControllerState(current);

    it('reports the newer target as available, not ready, once a ready B is stale against latest C', () => {
      const snapshot = projectAppUpdateSnapshot({
        ...base,
        latestRelease: c,
        preparation: { status: 'ready', release: b },
      });
      expect(snapshot.updateState).toBe('available');
      expect(snapshot.latestRelease).toEqual(c);
    });

    it('reports the newer target as available, not failed, once a failed B is stale against latest C', () => {
      const snapshot = projectAppUpdateSnapshot({
        ...base,
        latestRelease: c,
        preparation: { status: 'failed', release: b },
      });
      expect(snapshot.updateState).toBe('available');
    });

    it('still reports ready/failed for a preparation whose target still matches the current latest', () => {
      expect(
        projectAppUpdateSnapshot({
          ...base,
          latestRelease: b,
          preparation: { status: 'ready', release: b },
        }).updateState,
      ).toBe('ready');
      expect(
        projectAppUpdateSnapshot({
          ...base,
          latestRelease: b,
          preparation: { status: 'failed', release: b },
        }).updateState,
      ).toBe('failed');
    });

    it('still reports ready/failed for a preparation target when no latestRelease is known at all', () => {
      expect(
        projectAppUpdateSnapshot({ ...base, preparation: { status: 'ready', release: b } })
          .updateState,
      ).toBe('ready');
      expect(
        projectAppUpdateSnapshot({ ...base, preparation: { status: 'failed', release: b } })
          .updateState,
      ).toBe('failed');
    });
  });
});
