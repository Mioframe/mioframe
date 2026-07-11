import { nextTick, ref, toValue } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RELEASE_WATCHER_SAFETY_TIMEOUT_MS } from './constants';
import { createPointerSession } from './PointerSession';
import { createReorderRegistry, registerItem } from './registry';

/**
 * Orchestration-level tests for `createPointerSession`, driven directly (no Vue component mount)
 * against a real, minimally-stubbed DOM so pointer/click/lostpointercapture events dispatch and
 * bubble exactly as they do in production. `requestAnimationFrame` is stubbed to a manual queue so
 * a single active frame can be driven deterministically instead of relying on real frame timing;
 * live reorder-during-drag geometry, touch timing, and autoscroll are covered by the Playwright
 * specs (per the project's UI browser behavior policy).
 */

let rafCallbacks: Map<number, FrameRequestCallback>;
let nextRafId: number;
let releasePointerCaptureSpy: ReturnType<typeof vi.fn<(pointerId: number) => void>>;

const createPointerEvent = (
  type: string,
  opts: {
    pointerId?: number;
    pointerType?: string;
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
): PointerEvent =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: opts.pointerId ?? 1,
    pointerType: opts.pointerType ?? 'mouse',
    clientX: opts.clientX ?? 0,
    clientY: opts.clientY ?? 0,
    button: opts.button ?? 0,
  });

const dispatchClick = (el: HTMLElement): boolean =>
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

const stubRect = (
  el: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
) => {
  const domRect: DOMRect = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => rect,
  };

  el.getBoundingClientRect = () => domRect;
  Object.defineProperty(el, 'clientLeft', { value: 0, configurable: true });
  Object.defineProperty(el, 'clientTop', { value: 0, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: rect.width, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: rect.height, configurable: true });
};

/**
 * Builds one session with two registered items, 'a' (100x100 at 0,0) and 'b' (100x100 at 200,0).
 * @returns The registry, elements, key state, callbacks, and session under test.
 */
const setupSession = () => {
  const registry = createReorderRegistry<string>();
  const containerEl = document.createElement('div');
  const itemA = document.createElement('div');
  const itemB = document.createElement('div');
  containerEl.append(itemA, itemB);
  document.body.append(containerEl);
  registry.containerEl = containerEl;
  registerItem(registry, 'a', itemA);
  registerItem(registry, 'b', itemB);

  stubRect(containerEl, { left: 0, top: 0, width: 400, height: 400 });
  stubRect(itemA, { left: 0, top: 0, width: 100, height: 100 });
  stubRect(itemB, { left: 200, top: 0, width: 100, height: 100 });

  let keys: string[] = ['a', 'b'];
  const getKeys = (): string[] => keys;
  const setKeys = (next: string[]): void => {
    keys = next;
  };
  const draggingKey = ref<string | null>(null);
  const onReorder = vi.fn((event: { key: string; fromIndex: number; toIndex: number }) => {
    const next = [...keys];
    const [moved] = next.splice(event.fromIndex, 1);
    if (moved !== undefined) next.splice(event.toIndex, 0, moved);
    keys = next;
  });
  const onDragStart = vi.fn();
  const onDragEnd = vi.fn();

  const session = createPointerSession<string>({
    registry,
    getKeys,
    getLongPressDelay: () => 400,
    draggingKey,
    onReorder,
    onDragStart,
    onDragEnd,
  });

  session.attachContainer(containerEl);

  return {
    registry,
    containerEl,
    itemA,
    itemB,
    getKeys,
    setKeys,
    draggingKey,
    onReorder,
    onDragStart,
    onDragEnd,
    session,
  };
};

/**
 * Like {@link setupSession}, but lets each consumer callback be swapped out for a test-controlled
 * implementation — used to exercise the consumer exception-safety boundary. `onReorder`'s override
 * receives `helpers` so a test can still perform the default accept-and-mutate behavior on some
 * calls (e.g. the live move) while throwing on others (e.g. the rollback). `wrapGetKeys` wraps
 * every `getKeys()` call the session makes, letting a test throw on a specific call by count.
 * @param overrides - Per-callback test overrides; omitted callbacks keep {@link setupSession}'s
 * default behavior.
 * @returns The registry, elements, key state, callbacks, and session under test.
 */
const setupThrowingSession = (
  overrides: {
    onReorder?: (
      event: { key: string; fromIndex: number; toIndex: number },
      helpers: { getKeys: () => string[]; setKeys: (next: string[]) => void },
    ) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    wrapGetKeys?: (getKeys: () => string[]) => () => string[];
  } = {},
) => {
  const registry = createReorderRegistry<string>();
  const containerEl = document.createElement('div');
  const itemA = document.createElement('div');
  const itemB = document.createElement('div');
  containerEl.append(itemA, itemB);
  document.body.append(containerEl);
  registry.containerEl = containerEl;
  registerItem(registry, 'a', itemA);
  registerItem(registry, 'b', itemB);

  stubRect(containerEl, { left: 0, top: 0, width: 400, height: 400 });
  stubRect(itemA, { left: 0, top: 0, width: 100, height: 100 });
  stubRect(itemB, { left: 200, top: 0, width: 100, height: 100 });

  let keys: string[] = ['a', 'b'];
  const baseGetKeys = (): string[] => keys;
  const setKeys = (next: string[]): void => {
    keys = next;
  };
  const getKeys = overrides.wrapGetKeys ? overrides.wrapGetKeys(baseGetKeys) : baseGetKeys;
  const draggingKey = ref<string | null>(null);

  const defaultOnReorder = (event: { key: string; fromIndex: number; toIndex: number }): void => {
    const next = [...keys];
    const [moved] = next.splice(event.fromIndex, 1);
    if (moved !== undefined) next.splice(event.toIndex, 0, moved);
    keys = next;
  };

  const onReorder = vi.fn((event: { key: string; fromIndex: number; toIndex: number }) => {
    if (overrides.onReorder) {
      overrides.onReorder(event, { getKeys: baseGetKeys, setKeys });
      return;
    }
    defaultOnReorder(event);
  });
  const onDragStart = vi.fn(overrides.onDragStart);
  const onDragEnd = vi.fn(overrides.onDragEnd);

  const session = createPointerSession<string>({
    registry,
    getKeys,
    getLongPressDelay: () => 400,
    draggingKey,
    onReorder,
    onDragStart,
    onDragEnd,
  });

  session.attachContainer(containerEl);

  return {
    registry,
    containerEl,
    itemA,
    itemB,
    getKeys: baseGetKeys,
    setKeys,
    draggingKey,
    onReorder,
    onDragStart,
    onDragEnd,
    session,
  };
};

/**
 * Dispatches pointerdown on `itemEl`, then a pointermove that crosses the mouse activation threshold.
 * @param itemEl - The item element to press down on.
 * @param pointerId - The pointer id to dispatch both events with.
 */
const activateOnItem = (itemEl: HTMLElement, pointerId = 1): void => {
  itemEl.dispatchEvent(createPointerEvent('pointerdown', { pointerId, clientX: 10, clientY: 10 }));
  window.dispatchEvent(createPointerEvent('pointermove', { pointerId, clientX: 20, clientY: 10 }));
};

/** Runs the single currently-scheduled animation frame, if any. */
const runFrame = (): void => {
  for (const [id, cb] of rafCallbacks) {
    rafCallbacks.delete(id);
    cb(performance.now());
    return;
  }
};

beforeEach(() => {
  rafCallbacks = new Map();
  nextRafId = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    nextRafId += 1;
    rafCallbacks.set(nextRafId, cb);
    return nextRafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCallbacks.delete(id);
  });

  // Always resolves the non-dragging item ('b') as the hit-test target, independent of the
  // stubbed rects' real screen coordinates: these tests only exercise session orchestration, not
  // live geometry, which is covered by hitTest.test.ts and the Playwright specs.
  document.elementsFromPoint = () => [];

  HTMLElement.prototype.setPointerCapture = vi.fn();
  releasePointerCaptureSpy = vi.fn();
  HTMLElement.prototype.releasePointerCapture = releasePointerCaptureSpy;
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('direct pointercancel', () => {
  it('fires exactly one cancelled onDragEnd and leaves no release watcher for a later click', () => {
    const { itemA, containerEl, onDragEnd } = setupSession();
    activateOnItem(itemA);

    window.dispatchEvent(createPointerEvent('pointercancel', { pointerId: 1 }));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ key: 'a', cancelled: true }));

    // The real mouse button lifting later must not retroactively arm suppression: no release
    // watcher was ever created for a direct pointercancel.
    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(containerEl)).toBe(true);
  });

  it('does not suppress a later, genuinely unrelated click', () => {
    const { itemA, containerEl } = setupSession();
    activateOnItem(itemA);

    window.dispatchEvent(createPointerEvent('pointercancel', { pointerId: 1 }));

    expect(dispatchClick(containerEl)).toBe(true);
  });

  it('does not schedule the release-watcher safety timer', () => {
    const { itemA } = setupSession();
    activateOnItem(itemA);

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    window.dispatchEvent(createPointerEvent('pointercancel', { pointerId: 1 }));

    expect(setTimeoutSpy).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });
});

describe('validation cleanup during pending activation', () => {
  it('cleans up a pending mouse session when controlled keys become duplicated before activation', () => {
    const { itemA, setKeys } = setupSession();

    itemA.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 10, clientY: 10 }),
    );
    // Controlled data changes during the pending (pre-threshold) delay.
    setKeys(['a', 'a']);

    expect(() => {
      window.dispatchEvent(
        createPointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 10 }),
      );
    }).toThrow(/duplicate controlled keys/);

    // A brand-new session must be startable immediately: the failed one left no stale session,
    // timer, or global listener behind.
    setKeys(['a', 'b']);
    const { itemA: itemA2, onDragStart } = setupSession();
    activateOnItem(itemA2);
    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('cleans up a pending touch session (clearing the long-press timer) when keys become duplicated before activation', () => {
    vi.useFakeTimers();
    try {
      const { itemA, setKeys } = setupSession();

      itemA.dispatchEvent(
        createPointerEvent('pointerdown', {
          pointerId: 1,
          pointerType: 'touch',
          clientX: 10,
          clientY: 10,
        }),
      );
      setKeys(['a', 'a']);

      expect(() => {
        vi.advanceTimersByTime(400);
      }).toThrow(/duplicate controlled keys/);

      // No further timer is left scheduled for the failed session.
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      vi.advanceTimersByTime(10000);
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up the pending session when getKeys() itself throws during activation', () => {
    const registry = createReorderRegistry<string>();
    const containerEl = document.createElement('div');
    const itemA = document.createElement('div');
    containerEl.append(itemA);
    document.body.append(containerEl);
    registry.containerEl = containerEl;
    registerItem(registry, 'a', itemA);

    let callCount = 0;
    const getKeys = (): string[] => {
      callCount += 1;
      if (callCount === 2) throw new Error('boom');
      return ['a', 'b'];
    };

    const draggingKey = ref<string | null>(null);
    const onDragStart = vi.fn();
    const session = createPointerSession<string>({
      registry,
      getKeys,
      getLongPressDelay: () => 400,
      draggingKey,
      onReorder: vi.fn(),
      onDragStart,
      onDragEnd: vi.fn(),
    });
    session.attachContainer(containerEl);

    itemA.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 10, clientY: 10 }),
    );

    expect(() => {
      window.dispatchEvent(
        createPointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 10 }),
      );
    }).toThrow('boom');

    expect(onDragStart).not.toHaveBeenCalled();
    expect(toValue(draggingKey)).toBeNull();
  });
});

describe('deferred pointerup settlement', () => {
  /**
   * Activates a drag on 'a', then drives one frame that requests and gets 'a'/'b' swapped.
   * @param setup - The session fixture returned by {@link setupSession}.
   */
  const activateAndAcceptMove = (setup: ReturnType<typeof setupSession>): void => {
    activateOnItem(setup.itemA);
    setup.registry.itemKeys.set(setup.itemB, 'b');
    document.elementsFromPoint = () => [setup.itemB, setup.containerEl];
    window.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 250, clientY: 10 }),
    );
    runFrame();

    expect(setup.onReorder).toHaveBeenCalledTimes(1);
  };

  it('disposes active effects (pointer capture) immediately on physical pointerup, before the deferred settlement resolves', () => {
    const setup = setupSession();
    activateAndAcceptMove(setup);

    releasePointerCaptureSpy.mockClear();

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));

    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(rafCallbacks.size).toBe(0);
    // Not settled yet: the DOM commit (nextTick) hasn't resolved.
    expect(setup.onDragEnd).not.toHaveBeenCalled();
  });

  it('an expected lostpointercapture after pointerup does not cancel the deferred completion', async () => {
    const setup = setupSession();
    activateAndAcceptMove(setup);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    // Active effects already disposed their own 'lostpointercapture' listener; dispatching it here
    // has no listener left to reach, modeling the browser's own post-release capture loss.
    setup.containerEl.dispatchEvent(createPointerEvent('lostpointercapture', { pointerId: 1 }));

    await nextTick();

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'a', cancelled: false }),
    );
  });

  it('an unexpected lostpointercapture before pointer termination still cancels', () => {
    const setup = setupSession();
    activateOnItem(setup.itemA);

    setup.containerEl.dispatchEvent(createPointerEvent('lostpointercapture', { pointerId: 1 }));

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'a', cancelled: true }),
    );
  });

  it('fires exactly one successful onDragEnd once the DOM commit resolves consistently', async () => {
    const setup = setupSession();
    activateAndAcceptMove(setup);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    await nextTick();

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith({
      key: 'a',
      initialIndex: 0,
      finalIndex: 1,
      cancelled: false,
    });
    expect(setup.draggingKey.value).toBeNull();
  });

  it('produces exactly one cancelled onDragEnd when an external mutation lands during the deferred window', async () => {
    const setup = setupSession();
    activateAndAcceptMove(setup);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    // An external, non-library change to the controlled order lands before the DOM commit settles.
    setup.setKeys(['a', 'b']);

    await nextTick();

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
  });

  it('cancelling (active-item unmount) during the deferred window fires exactly one cancelled onDragEnd, and the stale DOM-commit settlement afterward is a no-op', async () => {
    const setup = setupSession();
    activateAndAcceptMove(setup);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    // The active key is removed while still waiting for the deferred DOM commit to resolve.
    setup.session.notifyItemUnmounted('a');

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'a', cancelled: true }),
    );

    // The original accepted move's nextTick still resolves afterward, but the settling session it
    // was waiting on has already ended: it must not mutate anything or fire a second onDragEnd.
    await nextTick();

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
  });
});

describe('consumer exception safety', () => {
  it('cleans up a throwing onDragStart, rethrows it unchanged, and still allows a later gesture', () => {
    const boom = new Error('boom-drag-start');
    let dragStartCalls = 0;
    const setup = setupThrowingSession({
      onDragStart: () => {
        dragStartCalls += 1;
        if (dragStartCalls === 1) throw boom;
      },
    });

    expect(() => {
      activateOnItem(setup.itemA);
    }).toThrow(boom);

    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();
    expect(setup.onReorder).not.toHaveBeenCalled();
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    // The pointer was still physically held at the throw: a bounded release watcher was armed.
    // Its matching real release suppresses the next click, then cleans itself up.
    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(false);
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    // A brand-new gesture (a different pointer) activates normally: nothing from the aborted
    // session — no stale `session`, listener, capture, or guard — is left behind.
    activateOnItem(setup.itemB, 2);
    expect(dragStartCalls).toBe(2);
    expect(setup.draggingKey.value).toBe('b');

    // End the second gesture so this session's global listeners don't leak into later tests.
    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 2 }));
  });

  it('cleans up a throwing live onReorder mid-frame and rethrows it unchanged', () => {
    const boom = new Error('boom-reorder');
    const setup = setupThrowingSession({
      onReorder: () => {
        throw boom;
      },
    });

    activateOnItem(setup.itemA);
    setup.registry.itemKeys.set(setup.itemB, 'b');
    document.elementsFromPoint = () => [setup.itemB, setup.containerEl];
    window.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 250, clientY: 10 }),
    );

    expect(() => {
      runFrame();
    }).toThrow(boom);

    expect(setup.onReorder).toHaveBeenCalledTimes(1);
    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();
    expect(setup.onDragEnd).not.toHaveBeenCalled();
    // No rollback and no other consumer callback: the controlled order is untouched.
    expect(setup.getKeys()).toEqual(['a', 'b']);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(false);
  });

  it('cleans up a throwing getKeys() during an active frame and rethrows it unchanged', () => {
    const boom = new Error('boom-active-frame-keys');
    let callCount = 0;
    const setup = setupThrowingSession({
      wrapGetKeys: (getKeys) => () => {
        callCount += 1;
        // Call 1 is onContainerPointerDown's validation, call 2 is activateSession's; call 3 is
        // the first active frame's own getKeys() read.
        if (callCount === 3) throw boom;
        return getKeys();
      },
    });

    activateOnItem(setup.itemA);
    expect(setup.onDragStart).toHaveBeenCalledTimes(1);

    expect(() => {
      runFrame();
    }).toThrow(boom);

    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();
    expect(setup.onReorder).not.toHaveBeenCalled();
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(false);
  });

  it('cleans up a throwing rollback onReorder and rethrows it unchanged', () => {
    const boom = new Error('boom-rollback');
    let onReorderCalls = 0;
    const setup = setupThrowingSession({
      onReorder: (event, helpers) => {
        onReorderCalls += 1;
        if (onReorderCalls === 2) throw boom;

        const next = [...helpers.getKeys()];
        const [moved] = next.splice(event.fromIndex, 1);
        if (moved !== undefined) next.splice(event.toIndex, 0, moved);
        helpers.setKeys(next);
      },
    });

    activateOnItem(setup.itemA);
    setup.registry.itemKeys.set(setup.itemB, 'b');
    document.elementsFromPoint = () => [setup.itemB, setup.containerEl];
    window.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 250, clientY: 10 }),
    );
    runFrame();

    expect(onReorderCalls).toBe(1);
    expect(setup.getKeys()).toEqual(['b', 'a']);

    // Escape cancels mid-drag, before physical release: rollback is attempted and its own
    // onReorder call throws.
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }).toThrow(boom);

    expect(onReorderCalls).toBe(2);
    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();
    expect(setup.onDragEnd).not.toHaveBeenCalled();
    // The failed rollback leaves the controlled order exactly as the accepted live move left it:
    // no further consumer callback and no invented state.
    expect(setup.getKeys()).toEqual(['b', 'a']);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(false);
  });

  it('cleans up a throwing getKeys() during pointerup reconciliation and rethrows it unchanged', () => {
    const boom = new Error('boom-pointerup-keys');
    let callCount = 0;
    const setup = setupThrowingSession({
      wrapGetKeys: (getKeys) => () => {
        callCount += 1;
        // Call 1 is onContainerPointerDown's validation, call 2 is activateSession's; call 3 is
        // reconcilePointerUp's own getKeys() read.
        if (callCount === 3) throw boom;
        return getKeys();
      },
    });

    activateOnItem(setup.itemA);

    expect(() => {
      window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    }).toThrow(boom);

    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();
    expect(setup.onDragEnd).not.toHaveBeenCalled();

    // The physical release already happened: normal click suppression was armed immediately
    // inside the original pointerup handling, before reconciliation's getKeys() ever threw — not
    // a bounded watcher (there is nothing left to watch for).
    expect(dispatchClick(setup.containerEl)).toBe(false);
  });

  it('has already cleaned up all session state before a throwing onDragEnd propagates', () => {
    const boom = new Error('boom-drag-end');
    const setup = setupThrowingSession({
      onDragEnd: () => {
        throw boom;
      },
    });

    activateOnItem(setup.itemA);

    expect(() => {
      window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    }).toThrow(boom);

    // Cleanup already happened before onDragEnd was invoked, not in reaction to its throw.
    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();

    // A brand-new gesture activates normally afterward.
    activateOnItem(setup.itemB, 2);
    expect(setup.draggingKey.value).toBe('b');

    // End the second gesture (onDragEnd throws again) so this session's global listeners don't
    // leak into later tests.
    expect(() => {
      window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 2 }));
    }).toThrow(boom);
  });
});

describe('unmount / dispose hard cleanup', () => {
  it('detachContainer cancels an active drag and leaves no release watcher or click suppression behind', () => {
    const setup = setupSession();
    activateOnItem(setup.itemA);
    expect(setup.draggingKey.value).toBe('a');

    setup.session.detachContainer(setup.containerEl);

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(setup.draggingKey.value).toBeNull();
    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);

    // selectstart is never prevented after cancellation (no post-cancel guard exists).
    const selectStartEvent = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(selectStartEvent);
    expect(selectStartEvent.defaultPrevented).toBe(false);

    // No pending release watcher survives: the original pointer's later release suppresses nothing.
    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(true);
  });

  it('dispose cancels an active drag and leaves no release watcher or click suppression behind', () => {
    const setup = setupSession();
    activateOnItem(setup.itemA);

    setup.session.dispose();

    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
    expect(setup.onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(setup.draggingKey.value).toBeNull();
    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);

    const selectStartEvent = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(selectStartEvent);
    expect(selectStartEvent.defaultPrevented).toBe(false);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(true);
  });

  it('detachContainer during a bounded release watcher (armed by an earlier active-item removal) still tears it down', () => {
    const setup = setupSession();
    activateOnItem(setup.itemA);

    // The active item unmounts while the container/composable stay mounted: a bounded release
    // watcher is armed because the physical pointer may still be held.
    setup.session.notifyItemUnmounted('a');
    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);

    // The container itself now unmounts before that watcher ever observes a release.
    setup.session.detachContainer(setup.containerEl);

    const selectStartEvent = new Event('selectstart', { cancelable: true });
    document.dispatchEvent(selectStartEvent);
    expect(selectStartEvent.defaultPrevented).toBe(false);

    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(true);
    // Still exactly one onDragEnd overall: detachContainer found no active session left to cancel.
    expect(setup.onDragEnd).toHaveBeenCalledTimes(1);
  });
});

describe('hard cleanup exception safety', () => {
  /**
   * Activates a drag on 'a', then drives one frame that requests and gets 'a'/'b' swapped —
   * mirrors the `deferred pointerup settlement` describe block's own helper, needed here to reach
   * cancellation's rollback branch. Consumes exactly 4 `getKeys()` calls and 1 `onReorder` call.
   * @param setup - The throwing-session fixture returned by {@link setupThrowingSession}.
   */
  const activateAndAcceptMove = (setup: ReturnType<typeof setupThrowingSession>): void => {
    activateOnItem(setup.itemA);
    setup.registry.itemKeys.set(setup.itemB, 'b');
    document.elementsFromPoint = () => [setup.itemB, setup.containerEl];
    window.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 250, clientY: 10 }),
    );
    runFrame();
  };

  /**
   * Runs `action` (expected to throw `boom` while hard-cancelling `setup`'s in-flight dragging
   * session), then asserts every cleanup guarantee the hard-cleanup exception boundary owes
   * regardless of which consumer call threw: the exact original error propagates, every
   * dragging-session side effect is gone, and no release watcher or click suppression survives to
   * observe a later matching release or the bounded safety timeout.
   * @param setup - The throwing-session fixture returned by {@link setupThrowingSession}.
   * @param action - The hard-cleanup call under test (`detachContainer` or `dispose`).
   * @param boom - The exact error instance the throwing consumer callback throws.
   */
  const expectExceptionSafeHardCleanup = (
    setup: ReturnType<typeof setupThrowingSession>,
    action: () => void,
    boom: Error,
  ): void => {
    let caught: unknown;
    try {
      action();
    } catch (error) {
      caught = error;
    }
    // The exact original error object is rethrown, not wrapped or replaced.
    expect(caught).toBe(boom);

    expect(rafCallbacks.size).toBe(0);
    expect(releasePointerCaptureSpy).toHaveBeenCalledWith(1);
    expect(setup.draggingKey.value).toBeNull();

    const dragEndCallsAfterThrow = setup.onDragEnd.mock.calls.length;
    // onDragEnd is never invoked twice by the throwing cleanup itself (at most the one call whose
    // own throw we just caught, for the onDragEnd-throws case; zero for every other throw point).
    expect(dragEndCallsAfterThrow).toBeLessThanOrEqual(1);

    // A later matching pointerup does not arm or suppress a click: no release watcher survived to
    // observe it.
    window.dispatchEvent(createPointerEvent('pointerup', { pointerId: 1 }));
    expect(dispatchClick(setup.containerEl)).toBe(true);

    // A later matching pointercancel has no effect either: nothing is left listening for it.
    window.dispatchEvent(createPointerEvent('pointercancel', { pointerId: 1 }));
    expect(setup.onDragEnd.mock.calls.length).toBe(dragEndCallsAfterThrow);

    // Further pointer movement cannot invoke reorder behavior: no session is left to hit-test or
    // request a move from.
    const onReorderCallsAfterThrow = setup.onReorder.mock.calls.length;
    window.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 300, clientY: 10 }),
    );
    expect(setup.onReorder.mock.calls.length).toBe(onReorderCallsAfterThrow);
    expect(rafCallbacks.size).toBe(0);

    // Advancing beyond the bounded release-watcher safety timeout produces no delayed behavior:
    // it was cleared by disarm(), not merely outrun.
    vi.advanceTimersByTime(RELEASE_WATCHER_SAFETY_TIMEOUT_MS + 1000);
    expect(setup.onDragEnd.mock.calls.length).toBe(dragEndCallsAfterThrow);
    expect(dispatchClick(setup.containerEl)).toBe(true);
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('detachContainer()', () => {
    it('still disarms and propagates when cancellation-time getKeys() (before rollback evaluation) throws', () => {
      const boom = new Error('boom-detach-keys-before-rollback');
      let callCount = 0;
      const setup = setupThrowingSession({
        wrapGetKeys: (getKeys) => () => {
          callCount += 1;
          // Call 1: onContainerPointerDown's validation. Call 2: activateSession's own read.
          // Call 3: cancelDraggingSession's pre-rollback read (no move was accepted, so no
          // further getKeys()/onReorder call happens before this one).
          if (callCount === 3) throw boom;
          return getKeys();
        },
      });

      activateOnItem(setup.itemA);
      expect(setup.onDragStart).toHaveBeenCalledTimes(1);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.detachContainer(setup.containerEl);
        },
        boom,
      );
    });

    it('still disarms and propagates when the rollback onReorder call throws', () => {
      const boom = new Error('boom-detach-rollback-reorder');
      let onReorderCalls = 0;
      const setup = setupThrowingSession({
        onReorder: (event, helpers) => {
          onReorderCalls += 1;
          if (onReorderCalls === 2) throw boom;

          const next = [...helpers.getKeys()];
          const [moved] = next.splice(event.fromIndex, 1);
          if (moved !== undefined) next.splice(event.toIndex, 0, moved);
          helpers.setKeys(next);
        },
      });

      activateAndAcceptMove(setup);
      expect(onReorderCalls).toBe(1);
      expect(setup.getKeys()).toEqual(['b', 'a']);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.detachContainer(setup.containerEl);
        },
        boom,
      );

      expect(onReorderCalls).toBe(2);
      // The failed rollback leaves the controlled order exactly as the accepted live move left it.
      expect(setup.getKeys()).toEqual(['b', 'a']);
    });

    it('still disarms and propagates when getKeys() evaluated after a successful rollback throws', () => {
      const boom = new Error('boom-detach-keys-after-rollback');
      let callCount = 0;
      const setup = setupThrowingSession({
        wrapGetKeys: (getKeys) => () => {
          callCount += 1;
          // Call 1-2: activation. Call 3: the first active frame's own read. Call 4:
          // requestMove's post-onReorder read. Call 5: cancelDraggingSession's pre-rollback
          // read. Call 6: cancelDraggingSession's post-rollback read.
          if (callCount === 6) throw boom;
          return getKeys();
        },
      });

      activateAndAcceptMove(setup);
      expect(setup.onReorder).toHaveBeenCalledTimes(1);
      expect(setup.getKeys()).toEqual(['b', 'a']);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.detachContainer(setup.containerEl);
        },
        boom,
      );

      // The rollback's own onReorder call still ran (and mutated the controlled order back)
      // before the post-rollback getKeys() read threw.
      expect(setup.onReorder).toHaveBeenCalledTimes(2);
    });

    it('still disarms and propagates when onDragEnd throws', () => {
      const boom = new Error('boom-detach-drag-end');
      const setup = setupThrowingSession({
        onDragEnd: () => {
          throw boom;
        },
      });

      activateOnItem(setup.itemA);
      expect(setup.onDragStart).toHaveBeenCalledTimes(1);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.detachContainer(setup.containerEl);
        },
        boom,
      );
    });
  });

  describe('dispose()', () => {
    it('still disarms and propagates when cancellation-time getKeys() throws', () => {
      const boom = new Error('boom-dispose-keys');
      let callCount = 0;
      const setup = setupThrowingSession({
        wrapGetKeys: (getKeys) => () => {
          callCount += 1;
          if (callCount === 3) throw boom;
          return getKeys();
        },
      });

      activateOnItem(setup.itemA);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.dispose();
        },
        boom,
      );
    });

    it('still disarms and propagates when onDragEnd throws', () => {
      const boom = new Error('boom-dispose-drag-end');
      const setup = setupThrowingSession({
        onDragEnd: () => {
          throw boom;
        },
      });

      activateOnItem(setup.itemA);

      expectExceptionSafeHardCleanup(
        setup,
        () => {
          setup.session.dispose();
        },
        boom,
      );
    });
  });
});
