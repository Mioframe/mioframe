import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, withDirectives, type Ref } from 'vue';
import type { ReorderDragEndEvent, ReorderDragStartEvent, ReorderMoveEvent } from './types';
import { useReorder } from './useReorder';

/**
 * These tests cover composable-level activation gating, cancellation, and key invariants using
 * dispatched pointer events on a minimally rendered harness. Live reorder-during-drag geometry,
 * touch timing, and autoscroll depend on real layout/hit-testing and are covered by the
 * Playwright specs instead (per the project's UI browser behavior policy); `requestAnimationFrame`
 * is stubbed here to never auto-fire, so this file never exercises that DOM-dependent code path.
 */

let rafCallbacks: Map<number, FrameRequestCallback>;
let nextRafId: number;

const createPointerEvent = (
  type: string,
  opts: {
    pointerId?: number;
    pointerType?: string;
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
): Event => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'pointerId', { value: opts.pointerId ?? 1, configurable: true });
  Object.defineProperty(event, 'pointerType', {
    value: opts.pointerType ?? 'mouse',
    configurable: true,
  });
  Object.defineProperty(event, 'clientX', { value: opts.clientX ?? 0, configurable: true });
  Object.defineProperty(event, 'clientY', { value: opts.clientY ?? 0, configurable: true });
  Object.defineProperty(event, 'button', { value: opts.button ?? 0, configurable: true });

  return event;
};

const createKeyDownEvent = (key: string): Event => {
  const event = new Event('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'key', { value: key, configurable: true });
  return event;
};

interface Callbacks {
  onReorder: ReturnType<typeof vi.fn<(event: ReorderMoveEvent<string>) => void>>;
  onDragStart: ReturnType<typeof vi.fn<(event: ReorderDragStartEvent<string>) => void>>;
  onDragEnd: ReturnType<typeof vi.fn<(event: ReorderDragEndEvent<string>) => void>>;
}

const mountHarness = (keys: Ref<string[]>, callbacks: Callbacks) => {
  const Harness = defineComponent({
    setup() {
      const { vReorderContainer, vReorderItem } = useReorder({
        keys,
        onReorder: callbacks.onReorder,
        onDragStart: callbacks.onDragStart,
        onDragEnd: callbacks.onDragEnd,
      });

      return () =>
        withDirectives(
          h(
            'div',
            { id: 'container' },
            keys.value.map((key) =>
              withDirectives(h('div', { key, 'data-key': key }), [[vReorderItem, key]]),
            ),
          ),
          [[vReorderContainer]],
        );
    },
  });

  return mount(Harness, { attachTo: document.body });
};

const getItemEl = (wrapper: VueWrapper, key: string): Element => {
  const el = wrapper.element.querySelector(`[data-key="${key}"]`);
  if (!el) throw new Error(`item "${key}" not found`);
  return el;
};

beforeEach(() => {
  rafCallbacks = new Map();
  nextRafId = 0;

  // Never auto-fire: these tests only exercise activation/cancellation, not the per-frame
  // geometry/hit-test/autoscroll loop, which needs real layout and is covered by Playwright.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    nextRafId += 1;
    rafCallbacks.set(nextRafId, cb);
    return nextRafId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCallbacks.delete(id);
  });

  document.elementsFromPoint = () => [];

  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useReorder activation gating', () => {
  it('does not activate below the mouse movement threshold, preserving a normal click', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'b').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 2 }));
    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 2 }));

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('activates once movement crosses the mouse threshold, firing onDragStart exactly once with the initial index', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'b').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith({ key: 'b', index: 1 });

    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 10 }));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith({
      key: 'b',
      initialIndex: 1,
      finalIndex: 1,
      cancelled: false,
    });
    expect(onReorder).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('ignores a pointerdown that does not resolve to a registered item', () => {
    const keys = ref(['a', 'b']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    wrapper.element.dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 50 }));

    expect(onDragStart).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('does not activate when the target key is no longer present at activation time', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'b').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    // Consumer removes the key before the DOM patch runs; getKeys() reads this live.
    keys.value = ['a', 'c'];
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('does not activate a stale duplicate-key element after a later element re-registers the same key', () => {
    const keys = ref(['dup', 'dup']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    const duplicateEls = wrapper.element.querySelectorAll('[data-key="dup"]');
    expect(duplicateEls).toHaveLength(2);

    const staleEl = duplicateEls[0];
    if (!staleEl) throw new Error('missing stale duplicate element');

    staleEl.dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).not.toHaveBeenCalled();

    const activeEl = duplicateEls[1];
    if (!activeEl) throw new Error('missing active duplicate element');

    activeEl.dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});

describe('useReorder cancellation', () => {
  it('cancels on Escape, firing onDragEnd exactly once with cancelled: true', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'b').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);

    document.dispatchEvent(createKeyDownEvent('Escape'));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith({
      key: 'b',
      initialIndex: 1,
      finalIndex: 1,
      cancelled: true,
    });

    // A stray pointerup after cancellation must not fire a second onDragEnd.
    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 10 }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('cancels a pending (not yet activated) session on Escape without firing any callback', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'b').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    document.dispatchEvent(createKeyDownEvent('Escape'));

    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('cancels on window blur while active', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'a').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('blur'));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith({
      key: 'a',
      initialIndex: 0,
      finalIndex: 0,
      cancelled: true,
    });

    wrapper.unmount();
  });

  it('cancels the active session when the container unmounts', () => {
    const keys = ref(['a', 'b', 'c']);
    const onReorder = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const wrapper = mountHarness(keys, { onReorder, onDragStart, onDragEnd });

    getItemEl(wrapper, 'a').dispatchEvent(createPointerEvent('pointerdown', { clientX: 0 }));
    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 10 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);

    wrapper.unmount();

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith({
      key: 'a',
      initialIndex: 0,
      finalIndex: 0,
      cancelled: true,
    });
  });
});
