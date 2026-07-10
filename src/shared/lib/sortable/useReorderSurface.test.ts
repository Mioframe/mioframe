import { effectScope, nextTick, ref, type ComputedRef, type EffectScope, type Ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReorderSessionCallbacks } from './reorderSession';
import {
  REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_SURFACE_ACTIVATING_CLASS,
} from './constants';

interface MockReorderSessionState {
  callbacks: ReorderSessionCallbacks | undefined;
  cancel: ReturnType<typeof vi.fn>;
  disabled: ComputedRef<boolean> | undefined;
}

const reorderSessionState = vi.hoisted<MockReorderSessionState>(() => ({
  callbacks: undefined,
  cancel: vi.fn(),
  disabled: undefined,
}));

vi.mock('./reorderSession', () => ({
  createReorderSession: (
    _container: unknown,
    {
      callbacks,
      disabled,
    }: {
      callbacks: ReorderSessionCallbacks;
      disabled?: ComputedRef<boolean>;
    },
  ) => {
    reorderSessionState.callbacks = callbacks;
    reorderSessionState.cancel = vi.fn();
    reorderSessionState.disabled = disabled;

    return {
      cancel: reorderSessionState.cancel,
    };
  },
}));

import { useReorderSurface } from './useReorderSurface';

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

const cleanupList: EffectScope[] = [];
const vibrateMock = vi.fn();
const rafMock = vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
  callback(0);
  return 1;
});

const mountUseReorderSurface = ({
  itemIdList,
  disabled,
  onCommit = vi.fn().mockResolvedValue(undefined),
}: {
  disabled?: Ref<boolean | undefined>;
  itemIdList: Ref<string[] | undefined>;
  onCommit?: (payload: unknown) => unknown;
}) => {
  const scope = effectScope();
  const containerEl = document.createElement('div');

  document.body.appendChild(containerEl);
  cleanupList.push(scope);

  const container = ref(containerEl);

  const api = scope.run(() =>
    useReorderSurface(container, {
      disabled,
      itemIdList,
      onCommit,
    }),
  );

  if (!api) {
    throw new Error('Failed to mount reorder surface');
  }

  return {
    api,
    container,
    onCommit,
    containerEl,
  };
};

afterEach(() => {
  cleanupList.splice(0).forEach((scope) => {
    scope.stop();
  });
  document.body.innerHTML = '';
  document.dispatchEvent(new Event('click'));
  reorderSessionState.callbacks = undefined;
  reorderSessionState.disabled = undefined;
  vibrateMock.mockReset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('useReorderSurface', () => {
  it('treats a drag end without a preceding session as a no-op', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
    expect(api.isDragging.value).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('rolls back to the latest external list when the item set changes mid-drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, onCommit } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);

    itemIdList.value = ['b', 'c', 'd'];

    await nextTick();
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'c', 'd']);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('defers a mid-commit external reorder of the same ids until the commit settles', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const commit = createDeferred<undefined>();
    const onCommit = vi.fn(() => commit.promise);
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    const endPromise = reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'a', 'c']);

    itemIdList.value = ['c', 'a', 'b'];

    await nextTick();

    // Mid-commit, the optimistic preview is authoritative; a genuinely different
    // external order is recorded but not merged in until the commit settles.
    expect(api.displayItemIdList.value).toEqual(['b', 'a', 'c']);

    commit.reject(new Error('conflict'));

    await endPromise;
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['c', 'a', 'b']);
  });

  it('rolls back to the latest external order when commit persistence fails', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn().mockRejectedValue(new Error('conflict'));
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
  });

  it('passes the session input through to the commit payload', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn().mockResolvedValue(undefined);
    mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'touch',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(onCommit).toHaveBeenCalledWith({
      orderedIds: ['b', 'a', 'c'],
      movedId: 'a',
      fromIndex: 0,
      toIndex: 1,
      input: 'touch',
    });
  });

  it('uses haptic feedback for touch input and cancels drags on Escape', async () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
    });

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'touch',
    });

    expect(vibrateMock).toHaveBeenCalledWith(10);
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(api.isDragging.value).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(reorderSessionState.cancel).toHaveBeenCalledTimes(1);
    expect(api.isDragging.value).toBe(false);
  });

  it('does not use haptics for mouse input and forwards the disabled option', async () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
    });

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const disabled = ref<boolean | undefined>(false);
    mountUseReorderSurface({
      itemIdList,
      disabled,
    });

    await nextTick();

    expect(reorderSessionState.disabled?.value).toBe(false);

    disabled.value = true;
    await nextTick();

    expect(reorderSessionState.disabled?.value).toBe(true);

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it('ignores non-Escape keys for keyboard cancellation', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await nextTick();

    expect(reorderSessionState.cancel).not.toHaveBeenCalled();
    expect(api.isDragging.value).toBe(true);
  });

  it('suppresses the first click inside the surface after a completed drag', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const child = document.createElement('button');
    containerEl.appendChild(child);
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges');
    const blurSpy = vi.spyOn(child, 'blur');
    child.focus();

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(clickEvent, 'stopPropagation');
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault');
    const stopImmediatePropagation = vi.spyOn(clickEvent, 'stopImmediatePropagation');

    child.dispatchEvent(clickEvent);
    await nextTick();

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(stopImmediatePropagation).toHaveBeenCalled();
    expect(removeAllRangesSpy).toHaveBeenCalled();
    expect(selection.rangeCount).toBe(0);
    expect(rafMock).toHaveBeenCalledTimes(1);
    expect(blurSpy).toHaveBeenCalled();

    // Suppression is a one-shot: the next click is no longer intercepted.
    const nextClickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const nextPreventDefault = vi.spyOn(nextClickEvent, 'preventDefault');

    child.dispatchEvent(nextClickEvent);
    await nextTick();

    expect(nextPreventDefault).not.toHaveBeenCalled();
  });

  it('clears suppression on an outside click without preventing it', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const inside = document.createElement('button');
    containerEl.appendChild(inside);
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    const outsideClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const outsidePreventDefault = vi.spyOn(outsideClickEvent, 'preventDefault');

    outside.dispatchEvent(outsideClickEvent);
    await nextTick();

    expect(outsidePreventDefault).not.toHaveBeenCalled();

    // The outside click already cleared suppression, so a click back inside the surface
    // is no longer intercepted either.
    const insideClickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const insidePreventDefault = vi.spyOn(insideClickEvent, 'preventDefault');

    inside.dispatchEvent(insideClickEvent);
    await nextTick();

    expect(insidePreventDefault).not.toHaveBeenCalled();
  });

  it('clears post-drag suppression on the next pointer input outside an active drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    // A new press on the surface clears stale post-drag suppression, so the click that
    // follows it is no longer intercepted.
    containerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault');

    containerEl.dispatchEvent(clickEvent);
    await nextTick();

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('does not commit when drag end keeps the same order', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('rolls back when drag end reports a different item set', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'x'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('rolls back after onCancel without committing', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    reorderSessionState.callbacks?.onCancel();
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
    expect(onCommit).not.toHaveBeenCalled();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault');

    containerEl.dispatchEvent(clickEvent);
    await nextTick();

    expect(preventDefault).toHaveBeenCalled();
  });

  it('exposes draggedId and reorder session state during an active drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    expect(api.draggedId.value).toBeUndefined();
    expect(api.isDragging.value).toBe(false);

    reorderSessionState.callbacks?.onActivate({
      itemId: 'b',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 1,
      input: 'pointer',
    });
    await nextTick();

    expect(api.draggedId.value).toBe('b');
    expect(api.isDragging.value).toBe(true);
  });

  it('suppresses document selection during the drag activation window and active drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('clears selection created between activation and drag start without relying on post-drag cleanup', async () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    const range = document.createRange();
    range.selectNode(row);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.rangeCount).toBe(0);

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });

    expect(selection.rangeCount).toBe(0);

    await nextTick();
  });

  it('applies activation suppression synchronously on valid reorder-item input', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    await nextTick();
  });

  it('does not prevent default on a mouse mousedown over a reorder item before drag is confirmed', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    const documentMouseDownHandler = vi.fn();
    document.addEventListener('mousedown', documentMouseDownHandler);

    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(mouseDownEvent, 'stopPropagation');

    row.dispatchEvent(mouseDownEvent);

    expect(mouseDownEvent.defaultPrevented).toBe(false);
    expect(stopPropagationSpy).not.toHaveBeenCalled();
    expect(documentMouseDownHandler).toHaveBeenCalledTimes(1);
    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    document.removeEventListener('mousedown', documentMouseDownHandler);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
  });

  it('does not prevent default on a mouse, touch, or pen pointerdown over a reorder item before drag is confirmed', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    const mousePointerDownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    });
    const stopPropagationSpy = vi.spyOn(mousePointerDownEvent, 'stopPropagation');

    row.dispatchEvent(mousePointerDownEvent);

    expect(mousePointerDownEvent.defaultPrevented).toBe(false);
    expect(stopPropagationSpy).not.toHaveBeenCalled();
    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();

    const touchPointerDownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
    });

    row.dispatchEvent(touchPointerDownEvent);

    expect(touchPointerDownEvent.defaultPrevented).toBe(false);
    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await nextTick();

    const penPointerDownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'pen',
    });

    row.dispatchEvent(penPointerDownEvent);

    expect(penPointerDownEvent.defaultPrevented).toBe(false);

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    await nextTick();
  });

  it('keeps activation release idempotent across repeated pointer-up-like events', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    expect(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }).not.toThrow();

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);

    await nextTick();
  });

  it('does not start activation suppression inside explicit ignore zones', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('div');
    row.setAttribute('data-sortable-id', 'a');
    const ignoreZone = document.createElement('span');
    ignoreZone.setAttribute(REORDER_IGNORE_ATTRIBUTE, '');
    const button = document.createElement('button');
    ignoreZone.appendChild(button);
    row.appendChild(ignoreZone);
    containerEl.appendChild(row);

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);

    await nextTick();
  });

  it('starts activation suppression from a nested interactive control that is not ignored', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('div');
    row.setAttribute('data-sortable-id', 'a');
    const button = document.createElement('button');
    row.appendChild(button);
    containerEl.appendChild(row);

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();
  });

  it('releases document suppression on cancel and dispose', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const row = document.createElement('button');
    row.setAttribute('data-sortable-id', 'a');
    containerEl.appendChild(row);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await nextTick();

    reorderSessionState.callbacks?.onCancel();
    await nextTick();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);

    row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    cleanupList.splice(0).forEach((scope) => {
      scope.stop();
    });

    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVATING_CLASS)).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('keeps document suppression active while overlapping reorder surfaces are still active', async () => {
    const firstItemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const secondItemIdList = ref<string[] | undefined>(['x', 'y', 'z']);
    const firstMount = mountUseReorderSurface({
      itemIdList: firstItemIdList,
    });
    const secondMount = mountUseReorderSurface({
      itemIdList: secondItemIdList,
    });
    const firstRow = document.createElement('button');
    const secondRow = document.createElement('button');
    firstRow.setAttribute('data-sortable-id', 'a');
    secondRow.setAttribute('data-sortable-id', 'x');
    firstMount.containerEl.appendChild(firstRow);
    secondMount.containerEl.appendChild(secondRow);

    firstRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    secondRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await nextTick();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);

    firstRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    secondRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    cleanupList.splice(0, 1).forEach((scope) => {
      scope.stop();
    });

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    cleanupList.splice(0).forEach((scope) => {
      scope.stop();
    });

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('runs touch cleanup through cancel()', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges');

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const focusedButton = document.createElement('button');
    containerEl.appendChild(focusedButton);
    focusedButton.focus();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'touch',
    });
    await nextTick();

    api.cancel();
    await nextTick();

    expect(reorderSessionState.cancel).toHaveBeenCalled();
    expect(removeAllRangesSpy).toHaveBeenCalled();

    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();

    expect(api.isDragging.value).toBe(false);
  });

  it('does not schedule drag cleanup when cancel is called before any drag starts', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    api.cancel();

    // Nothing was pending or dragging, so there is nothing to cancel or clean up.
    expect(reorderSessionState.cancel).not.toHaveBeenCalled();
    expect(rafMock).not.toHaveBeenCalled();
    expect(api.isDragging.value).toBe(false);
  });

  it('cleans selection without blurring elements outside the surface', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges');

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    containerEl.appendChild(inside);
    document.body.appendChild(outside);
    const outsideBlur = vi.spyOn(outside, 'blur');
    outside.focus();

    await nextTick();

    reorderSessionState.callbacks?.onActivate({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    await reorderSessionState.callbacks?.onEnd({
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    inside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();

    expect(removeAllRangesSpy).toHaveBeenCalled();
    expect(outsideBlur).not.toHaveBeenCalled();
  });
});
