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
      this.listener = listener;
    },
  );

  public readonly removeEventListener = vi.fn(
    (_type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void) => {
      if (this.listener === listener) {
        this.listener = undefined;
      }
    },
  );

  public listener: ((event: BeforeUnloadEvent) => void) | undefined;
}

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

    target.listener?.(event);

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

    const listener = target.listener;

    isBlocked.value = false;
    await Promise.resolve();

    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
    expect(target.listener).toBeUndefined();

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

    const listener = target.listener;

    scope.stop();

    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', listener);
    expect(target.listener).toBeUndefined();
  });
});
