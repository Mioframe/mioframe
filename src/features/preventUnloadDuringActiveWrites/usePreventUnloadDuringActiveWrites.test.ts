import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import {
  shouldPreventUnloadDuringActiveWrites,
  useBeforeUnloadGuard,
} from './usePreventUnloadDuringActiveWrites';

class MockBeforeUnloadTarget {
  public readonly addEventListener = vi.fn(
    (_type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void) => {
      this.listeners.add(listener);
    },
  );

  public readonly removeEventListener = vi.fn(
    (_type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void) => {
      this.listeners.delete(listener);
    },
  );

  public readonly listeners = new Set<(event: BeforeUnloadEvent) => void>();
}

const getRequiredListener = (
  target: MockBeforeUnloadTarget,
): ((event: BeforeUnloadEvent) => void) => {
  const [listener] = [...target.listeners];

  if (listener === undefined) {
    throw new Error('Expected a beforeunload listener to be registered.');
  }

  return listener;
};

const createState = (overrides: Partial<VfsActivityState> = {}): VfsActivityState => ({
  status: 'idle',
  activeCount: 0,
  ...overrides,
});

describe('shouldPreventUnloadDuringActiveWrites', () => {
  it('returns false when there are no active mutations', () => {
    expect(shouldPreventUnloadDuringActiveWrites(createState({ activeCount: 0 }))).toBe(false);
  });

  it('returns true when there is at least one active mutation', () => {
    expect(shouldPreventUnloadDuringActiveWrites(createState({ activeCount: 1 }))).toBe(true);
    expect(shouldPreventUnloadDuringActiveWrites(createState({ activeCount: 2 }))).toBe(true);
  });

  it('ignores lastError when there are no active mutations', () => {
    expect(
      shouldPreventUnloadDuringActiveWrites(
        createState({
          activeCount: 0,
          lastError: {
            acknowledged: false,
            message: 'write failed',
            occurredAt: Date.now(),
            operationType: 'writeFile',
            path: '/notes/today.md',
          },
          status: 'error',
        }),
      ),
    ).toBe(false);
  });
});

describe('useBeforeUnloadGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds one listener when the guard becomes active', async () => {
    const isBlocked = ref(false);
    const target = new MockBeforeUnloadTarget();
    const scope = effectScope();

    scope.run(() => {
      useBeforeUnloadGuard(
        computed(() => isBlocked.value),
        target,
      );
    });

    expect(target.addEventListener).not.toHaveBeenCalled();

    isBlocked.value = true;
    await Promise.resolve();

    expect(target.addEventListener).toHaveBeenCalledTimes(1);
    expect(target.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    scope.stop();
  });

  it('prevents unload and sets the browser-managed return value while active', () => {
    const isBlocked = ref(true);
    const target = new MockBeforeUnloadTarget();
    const scope = effectScope();

    scope.run(() => {
      useBeforeUnloadGuard(
        computed(() => isBlocked.value),
        target,
      );
    });

    const event = new BeforeUnloadEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    const listener = getRequiredListener(target);
    listener(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- The guard must set returnValue for browser prompts.
    expect(event.returnValue).toBe('');

    scope.stop();
  });

  it('removes the listener when the guard becomes inactive', async () => {
    const isBlocked = ref(true);
    const target = new MockBeforeUnloadTarget();
    const scope = effectScope();

    scope.run(() => {
      useBeforeUnloadGuard(
        computed(() => isBlocked.value),
        target,
      );
    });

    const listener = getRequiredListener(target);

    isBlocked.value = false;
    await Promise.resolve();

    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
    expect(target.listeners.size).toBe(0);

    scope.stop();
  });

  it('does not add a second listener when activity count grows while already active', async () => {
    const activeCount = ref(1);
    const target = new MockBeforeUnloadTarget();
    const scope = effectScope();

    scope.run(() => {
      useBeforeUnloadGuard(
        computed(() => activeCount.value > 0),
        target,
      );
    });

    expect(target.addEventListener).toHaveBeenCalledTimes(1);

    activeCount.value = 2;
    await Promise.resolve();

    expect(target.addEventListener).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('removes the listener when the effect scope stops', () => {
    const isBlocked = ref(true);
    const target = new MockBeforeUnloadTarget();
    const scope = effectScope();

    scope.run(() => {
      useBeforeUnloadGuard(
        computed(() => isBlocked.value),
        target,
      );
    });

    const listener = getRequiredListener(target);

    scope.stop();

    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
    expect(target.listeners.size).toBe(0);
  });

  it('keeps multiple guard listeners independent on the same target', () => {
    const target = new MockBeforeUnloadTarget();
    const firstScope = effectScope();
    const secondScope = effectScope();

    firstScope.run(() => {
      useBeforeUnloadGuard(
        computed(() => true),
        target,
      );
    });

    secondScope.run(() => {
      useBeforeUnloadGuard(
        computed(() => true),
        target,
      );
    });

    expect(target.addEventListener).toHaveBeenCalledTimes(2);

    const firstListener = target.addEventListener.mock.calls[0]?.[1];
    const secondListener = target.addEventListener.mock.calls[1]?.[1];

    expect(firstListener).toEqual(expect.any(Function));
    expect(secondListener).toEqual(expect.any(Function));

    if (firstListener === undefined || secondListener === undefined) {
      throw new Error('Expected both beforeunload listeners to be registered.');
    }

    expect(firstListener).not.toBe(secondListener);
    expect(target.listeners.has(firstListener)).toBe(true);
    expect(target.listeners.has(secondListener)).toBe(true);

    firstScope.stop();

    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', firstListener);
    expect(target.listeners.has(firstListener)).toBe(false);
    expect(target.listeners.has(secondListener)).toBe(true);

    const event = new BeforeUnloadEvent();
    const preventDefault = vi.spyOn(event, 'preventDefault');

    secondListener(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- The guard must set returnValue for browser prompts.
    expect(event.returnValue).toBe('');

    secondScope.stop();

    expect(target.removeEventListener).toHaveBeenCalledTimes(2);
    expect(target.removeEventListener).toHaveBeenLastCalledWith('beforeunload', secondListener);
    expect(target.listeners.size).toBe(0);
  });
});
