import { filter, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createVfsActivityTracker,
  type VfsActivityState,
  type VfsActivityTracker,
} from './VfsActivityTracker';

const getCurrentState = async (tracker: VfsActivityTracker): Promise<VfsActivityState> =>
  firstValueFrom(tracker.state$);

describe('VfsActivityTracker', () => {
  let tracker: VfsActivityTracker;

  beforeEach(() => {
    tracker = createVfsActivityTracker();
  });

  it('starts idle with no active operations', () => {
    return expect(getCurrentState(tracker)).resolves.toEqual({
      status: 'idle',
      activeCount: 0,
    });
  });

  it('emits active then idle for a successful operation', async () => {
    const states: string[] = [];
    const subscription = tracker.state$.subscribe((state) => {
      states.push(`${state.status}:${state.activeCount}`);
    });

    await tracker.track({ type: 'writeFile', path: '/file.txt' }, () => Promise.resolve(undefined));

    expect(states).toEqual(['idle:0', 'active:1', 'idle:0']);

    subscription.unsubscribe();
  });

  it('counts parallel operations correctly', async () => {
    let releaseFirst: () => void = () => undefined;
    let releaseSecond: () => void = () => undefined;
    const counts: number[] = [];
    const subscription = tracker.state$.subscribe((state) => {
      counts.push(state.activeCount);
    });

    const first = tracker.track(
      { type: 'writeFile', path: '/first.txt' },
      () =>
        new Promise<void>((resolve) => {
          releaseFirst = resolve;
        }),
    );
    const second = tracker.track(
      { type: 'delete', path: '/second.txt' },
      () =>
        new Promise<void>((resolve) => {
          releaseSecond = resolve;
        }),
    );

    expect(counts).toEqual([0, 1, 2]);

    releaseFirst();
    await first;
    expect(counts).toEqual([0, 1, 2, 1]);

    releaseSecond();
    await second;
    expect(counts).toEqual([0, 1, 2, 1, 0]);

    subscription.unsubscribe();
  });

  it('stores failed operation details and rethrows the error', async () => {
    const error = new Error('disk full');

    await expect(
      tracker.track({ type: 'writeFile', path: '/file.txt' }, () => Promise.reject(error)),
    ).rejects.toBe(error);

    const states = await firstValueFrom(
      tracker.state$.pipe(filter((state) => state.status === 'error')),
    );

    expect(states).toMatchObject({
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'writeFile',
        path: '/file.txt',
        message: 'disk full',
        acknowledged: false,
      },
    });
  });

  it('acknowledges the current error', async () => {
    await tracker
      .track({ type: 'delete', path: '/file.txt' }, () => Promise.reject(new Error('denied')))
      .catch(() => undefined);

    tracker.acknowledgeError();

    const state = await firstValueFrom(
      tracker.state$.pipe(filter((nextState) => nextState.lastError?.acknowledged === true)),
    );

    expect(state).toMatchObject({
      status: 'idle',
      activeCount: 0,
      lastError: {
        acknowledged: true,
      },
    });
  });

  it('clears an acknowledged error on the next successful mutation', async () => {
    await tracker
      .track({ type: 'delete', path: '/file.txt' }, () => Promise.reject(new Error('denied')))
      .catch(() => undefined);
    tracker.acknowledgeError();

    await tracker.track({ type: 'move', path: '/file.txt', newPath: '/renamed.txt' }, () =>
      Promise.resolve(undefined),
    );

    const state = await firstValueFrom(
      tracker.state$.pipe(
        filter((nextState) => nextState.status === 'idle' && nextState.activeCount === 0),
      ),
    );

    expect(state).toEqual({
      status: 'idle',
      activeCount: 0,
      lastError: undefined,
    });
  });

  it('keeps an unacknowledged error after a successful mutation', async () => {
    await tracker
      .track({ type: 'delete', path: '/file.txt' }, () => Promise.reject(new Error('denied')))
      .catch(() => undefined);

    await tracker.track({ type: 'createDirectory', path: '/folder' }, () =>
      Promise.resolve(undefined),
    );

    const state = await firstValueFrom(
      tracker.state$.pipe(
        filter((nextState) => nextState.status === 'error' && nextState.activeCount === 0),
      ),
    );

    expect(state).toMatchObject({
      status: 'error',
      activeCount: 0,
      lastError: {
        operationType: 'delete',
        path: '/file.txt',
        acknowledged: false,
      },
    });
  });
});
