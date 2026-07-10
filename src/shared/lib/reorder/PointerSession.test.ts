import { nextTick, ref, toValue } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    }).toThrow(/duplicate key/);

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
      }).toThrow(/duplicate key/);

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
