import { effectScope, nextTick, ref, type ComputedRef, type EffectScope, type Ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ReorderEngineCallbacks,
  ReorderInputProfile,
  ReorderActivation,
  ReorderDensity,
  ReorderLayout,
} from './reorderTypes';
import { REORDER_SURFACE_DRAGGING_CLASS } from './constants';

interface MockSortableAdapterState {
  callbacks: ReorderEngineCallbacks | undefined;
  cancel: ReturnType<typeof vi.fn>;
  disabled: ComputedRef<boolean> | undefined;
  interactiveSelector: ComputedRef<string> | undefined;
  layout: ComputedRef<ReorderLayout> | undefined;
  profile: ComputedRef<ReorderInputProfile> | undefined;
}

const sortableAdapterState = vi.hoisted<MockSortableAdapterState>(() => ({
  callbacks: undefined,
  cancel: vi.fn(),
  disabled: undefined,
  interactiveSelector: undefined,
  layout: undefined,
  profile: undefined,
}));

vi.mock('./sortableAdapter', () => ({
  createSortableAdapter: (
    _container: unknown,
    {
      callbacks,
      disabled,
      interactiveSelector,
      layout,
      profile,
    }: {
      callbacks?: ReorderEngineCallbacks;
      disabled?: ComputedRef<boolean>;
      interactiveSelector?: ComputedRef<string>;
      layout?: ComputedRef<ReorderLayout>;
      profile?: ComputedRef<ReorderInputProfile>;
    },
  ) => {
    sortableAdapterState.callbacks = callbacks;
    sortableAdapterState.cancel = vi.fn();
    sortableAdapterState.disabled = disabled;
    sortableAdapterState.interactiveSelector = interactiveSelector;
    sortableAdapterState.layout = layout;
    sortableAdapterState.profile = profile;

    return {
      sortable: undefined,
      destroy: vi.fn(),
      sort: vi.fn(),
      toArray: () => [],
      cancel: sortableAdapterState.cancel,
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
  activation,
  density,
  disabled,
  interactiveSelector,
  layout,
  onCommit = vi.fn().mockResolvedValue(undefined),
}: {
  activation?: Ref<ReorderActivation | undefined>;
  density?: Ref<ReorderDensity | undefined>;
  disabled?: Ref<boolean | undefined>;
  interactiveSelector?: Ref<string | undefined>;
  itemIdList: Ref<string[] | undefined>;
  layout?: Ref<ReorderLayout | undefined>;
  onCommit?: (payload: unknown) => unknown;
}) => {
  const scope = effectScope();
  const containerEl = document.createElement('div');

  document.body.appendChild(containerEl);
  cleanupList.push(scope);

  const container = ref(containerEl);

  const api = scope.run(() =>
    useReorderSurface(container, {
      activation,
      density,
      disabled,
      interactiveSelector,
      itemIdList,
      layout,
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
  sortableAdapterState.callbacks = undefined;
  sortableAdapterState.disabled = undefined;
  sortableAdapterState.interactiveSelector = undefined;
  sortableAdapterState.layout = undefined;
  sortableAdapterState.profile = undefined;
  vibrateMock.mockReset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('useReorderSurface', () => {
  it('treats a drag end without a valid item id as a no-op', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: '',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });

    expect(api.isDragging.value).toBe(false);
    expect(api.draggedId.value).toBeUndefined();

    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: '',
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

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'a', 'c']);

    itemIdList.value = ['b', 'c', 'd'];

    await nextTick();
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'c', 'd']);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('accepts an external reorder of the same ids while an optimistic commit is pending', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const commit = createDeferred<undefined>();
    const onCommit = vi.fn(() => commit.promise);
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    const endPromise = sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['b', 'a', 'c']);

    itemIdList.value = ['c', 'a', 'b'];

    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['c', 'a', 'b']);

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

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
  });

  it('uses haptic feedback for touch input and cancels pointer drags on Escape', async () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
    });

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });

    containerEl.dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });

    expect(vibrateMock).toHaveBeenCalledWith(10);
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(api.activeProfile.value.input).toBe('touch');

    containerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(sortableAdapterState.cancel).toHaveBeenCalledTimes(1);
    expect(vibrateMock).toHaveBeenCalledTimes(1);
    expect(api.suppressNextClick.value).toBe(true);
  });

  it('reacts to layout, activation, density, disabled, and selector option refs', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const layout = ref<ReorderLayout | undefined>('grid');
    const activation = ref<ReorderActivation | undefined>('longPress');
    const density = ref<ReorderDensity | undefined>('dense');
    const disabled = ref<boolean | undefined>(false);
    const interactiveSelector = ref<string | undefined>('[data-ignore]');

    mountUseReorderSurface({
      activation,
      density,
      disabled,
      interactiveSelector,
      itemIdList,
      layout,
    });

    await nextTick();

    expect(sortableAdapterState.layout?.value).toBe('grid');
    expect(sortableAdapterState.disabled?.value).toBe(false);
    expect(sortableAdapterState.interactiveSelector?.value).toBe('[data-ignore]');
    expect(sortableAdapterState.profile?.value).toMatchObject({
      layout: 'grid',
      activation: 'longPress',
      density: 'dense',
    });

    layout.value = 'horizontal';
    activation.value = 'immediate';
    density.value = 'precision';
    disabled.value = true;
    interactiveSelector.value = 'button';
    await nextTick();

    expect(sortableAdapterState.layout?.value).toBe('horizontal');
    expect(sortableAdapterState.disabled?.value).toBe(true);
    expect(sortableAdapterState.interactiveSelector?.value).toBe('button');
    expect(sortableAdapterState.profile?.value).toMatchObject({
      layout: 'horizontal',
      activation: 'immediate',
      density: 'precision',
    });
  });

  it('ignores non-Escape keys and touch drags for keyboard cancellation', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });

    containerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await nextTick();

    expect(sortableAdapterState.cancel).not.toHaveBeenCalled();
    expect(api.isDragging.value).toBe(true);

    containerEl.dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(sortableAdapterState.cancel).not.toHaveBeenCalled();
    expect(api.isDragging.value).toBe(true);
  });

  it('suppresses the first click inside the surface after a completed drag', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
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
    Object.defineProperty(selection, 'rangeCount', {
      configurable: true,
      get: () => 1,
    });
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges');
    const blurSpy = vi.spyOn(child, 'blur');
    child.focus();

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.suppressNextClick.value).toBe(true);

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
    expect(removeAllRangesSpy).toHaveBeenCalledTimes(2);
    expect(rafMock).toHaveBeenCalledTimes(1);
    expect(blurSpy).toHaveBeenCalled();
    expect(api.suppressNextClick.value).toBe(false);
  });

  it('clears suppression on an outside click without preventing it', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(clickEvent, 'preventDefault');

    outside.dispatchEvent(clickEvent);
    await nextTick();

    expect(preventDefault).not.toHaveBeenCalled();
    expect(api.suppressNextClick.value).toBe(false);
  });

  it('clears post-drag suppression on the next pointer input outside an active drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.suppressNextClick.value).toBe(true);

    containerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    expect(api.suppressNextClick.value).toBe(false);
  });

  it('does not commit when drag end keeps the same order', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const onCommit = vi.fn();
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
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

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
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
    const { api } = mountUseReorderSurface({
      itemIdList,
      onCommit,
    });

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    sortableAdapterState.callbacks?.onCancel?.();
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await nextTick();

    expect(api.displayItemIdList.value).toEqual(['a', 'b', 'c']);
    expect(api.suppressNextClick.value).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('exposes draggedId and reorder session state during an active drag', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    expect(api.draggedId.value).toBeUndefined();
    expect(api.isReorderSession.value).toBe(false);

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'b',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 1,
      toIndex: 1,
    });
    await nextTick();

    expect(api.draggedId.value).toBe('b');
    expect(api.isReorderSession.value).toBe(true);
  });

  it('ignores interactive descendants when syncing pointer input', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const reorderItem = document.createElement('div');
    reorderItem.setAttribute('data-reorder-item', '');
    const button = document.createElement('button');
    reorderItem.appendChild(button);
    containerEl.appendChild(reorderItem);

    containerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.activeProfile.value.input).toBe('pointer');

    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    await nextTick();

    expect(api.activeProfile.value.input).toBe('pointer');
  });

  it('returns early for mismatched event payloads on pointer listeners', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api, containerEl } = mountUseReorderSurface({
      itemIdList,
    });

    containerEl.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    containerEl.dispatchEvent(new Event('touchstart', { bubbles: true }));
    containerEl.dispatchEvent(new Event('mousedown', { bubbles: true }));
    await nextTick();

    expect(api.activeProfile.value.input).toBe('pointer');
  });

  it('toggles the dragging class and runs touch cleanup through cancel()', async () => {
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

    containerEl.dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(true);

    api.cancel();
    await nextTick();

    expect(sortableAdapterState.cancel).toHaveBeenCalled();
    expect(removeAllRangesSpy).toHaveBeenCalled();
    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(true);

    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(false);
  });

  it('moves the dragging class when the tracked container element changes', async () => {
    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { container, containerEl } = mountUseReorderSurface({
      itemIdList,
    });
    const nextContainerEl = document.createElement('div');
    document.body.appendChild(nextContainerEl);

    await nextTick();

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(true);

    container.value = nextContainerEl;
    await nextTick();

    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(false);
    expect(nextContainerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(true);
  });

  it('does not schedule drag cleanup when cancel is called before any drag starts', async () => {
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const itemIdList = ref<string[] | undefined>(['a', 'b', 'c']);
    const { api } = mountUseReorderSurface({
      itemIdList,
    });

    await nextTick();

    api.cancel();

    expect(sortableAdapterState.cancel).toHaveBeenCalled();
    expect(rafMock).not.toHaveBeenCalled();
    expect(api.suppressNextClick.value).toBe(false);
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

    sortableAdapterState.callbacks?.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    sortableAdapterState.callbacks?.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await sortableAdapterState.callbacks?.onEnd?.({
      itemId: 'a',
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
