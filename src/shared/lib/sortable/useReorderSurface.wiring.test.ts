import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type ComputedRef, type EffectScope } from 'vue';
import {
  defaultReorderInteractiveSelector,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_SURFACE_DRAGGING_CLASS,
} from './constants';
import type {
  ReorderActivation,
  ReorderDensity,
  ReorderEngineCallbacks,
  ReorderInputProfile,
  ReorderInteractiveStrategy,
  ReorderLayout,
} from './reorderTypes';

interface RecordedListener {
  event: string;
  handler: (event: Event) => unknown;
  options: AddEventListenerOptions | boolean | undefined;
}

interface RecordedAdapterState {
  callbacks: ReorderEngineCallbacks | undefined;
  disabled: ComputedRef<boolean> | undefined;
  interactiveSelector: ComputedRef<string> | undefined;
  layout: ComputedRef<ReorderLayout> | undefined;
  profile: ComputedRef<ReorderInputProfile> | undefined;
}

const cleanupList: EffectScope[] = [];

const setupModule = async () => {
  const listeners: RecordedListener[] = [];
  const adapterState: RecordedAdapterState = {
    callbacks: undefined,
    disabled: undefined,
    interactiveSelector: undefined,
    layout: undefined,
    profile: undefined,
  };

  vi.resetModules();
  vi.doMock('@vueuse/core', () => ({
    unrefElement: (value: { value?: unknown } | null | undefined) => value?.value ?? value,
    useEventListener: (
      _target: unknown,
      event: string,
      handler: (event: Event) => unknown,
      options?: AddEventListenerOptions | boolean,
    ) => {
      listeners.push({
        event,
        handler,
        options,
      });

      return () => undefined;
    },
  }));
  vi.doMock('./sortableAdapter', () => ({
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
      adapterState.callbacks = callbacks;
      adapterState.disabled = disabled;
      adapterState.interactiveSelector = interactiveSelector;
      adapterState.layout = layout;
      adapterState.profile = profile;

      return {
        sortable: undefined,
        destroy: vi.fn(),
        sort: vi.fn(),
        toArray: () => [],
        cancel: vi.fn(),
      };
    },
  }));

  const mod = await import('./useReorderSurface');

  return {
    adapterState,
    listeners,
    useReorderSurface: mod.useReorderSurface,
  };
};

const mountUseReorderSurface = async ({
  activation,
  density,
  disabled,
  interactiveSelector,
  interactiveStrategy,
  itemIdList = ref<string[] | undefined>(['a', 'b', 'c']),
  layout,
}: {
  activation?: ReturnType<typeof ref<ReorderActivation | undefined>>;
  density?: ReturnType<typeof ref<ReorderDensity | undefined>>;
  disabled?: ReturnType<typeof ref<boolean | undefined>>;
  interactiveSelector?: ReturnType<typeof ref<string | undefined>>;
  interactiveStrategy?: ReturnType<typeof ref<ReorderInteractiveStrategy | undefined>>;
  itemIdList?: ReturnType<typeof ref<string[] | undefined>>;
  layout?: ReturnType<typeof ref<ReorderLayout | undefined>>;
} = {}) => {
  const { adapterState, listeners, useReorderSurface } = await setupModule();
  const scope = effectScope();
  const containerEl = document.createElement('div');
  document.body.appendChild(containerEl);
  const container = ref(containerEl);

  const api = scope.run(() =>
    useReorderSurface(container, {
      activation,
      density,
      disabled,
      interactiveSelector,
      interactiveStrategy,
      itemIdList,
      layout,
      onCommit: vi.fn(),
    }),
  );

  if (!api) {
    throw new Error('Failed to mount reorder surface');
  }

  cleanupList.push(scope);

  return {
    adapterState,
    api,
    container,
    containerEl,
    itemIdList,
    listeners,
  };
};

afterEach(() => {
  cleanupList.splice(0).forEach((scope) => {
    scope.stop();
  });
  document.body.innerHTML = '';
  vi.clearAllMocks();
  vi.doUnmock('@vueuse/core');
  vi.doUnmock('./sortableAdapter');
});

describe('useReorderSurface wiring', () => {
  it('registers event listeners with the expected options', async () => {
    const { listeners } = await mountUseReorderSurface();

    expect(listeners).toEqual(
      expect.arrayContaining([
        {
          event: 'pointerdown',
          handler: expect.any(Function),
          options: { capture: true, passive: false },
        },
        {
          event: 'touchstart',
          handler: expect.any(Function),
          options: { capture: true, passive: true },
        },
        {
          event: 'mousedown',
          handler: expect.any(Function),
          options: { capture: true, passive: false },
        },
        {
          event: 'pointerup',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'pointercancel',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'mouseup',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'touchend',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'touchcancel',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'click',
          handler: expect.any(Function),
          options: { capture: true },
        },
        {
          event: 'keydown',
          handler: expect.any(Function),
          options: undefined,
        },
      ]),
    );
  });

  it('uses default adapter config when optional refs are omitted', async () => {
    const { adapterState, api, containerEl } = await mountUseReorderSurface();

    expect(adapterState.layout?.value).toBe('vertical');
    expect(adapterState.disabled?.value).toBe(false);
    expect(adapterState.interactiveSelector?.value).toBe(defaultReorderInteractiveSelector);
    expect(adapterState.profile?.value).toMatchObject({
      activation: 'immediate',
      density: 'comfortable',
      forceFallback: true,
      fallbackOnBody: true,
      layout: 'vertical',
      suppressClickAfterDrag: true,
    });
    expect(api.activeProfile.value).toMatchObject({
      activation: 'immediate',
      density: 'comfortable',
      layout: 'vertical',
    });
    expect(containerEl.classList.contains(REORDER_SURFACE_DRAGGING_CLASS)).toBe(false);
  });

  it('forwards reactive option refs into the adapter profile', async () => {
    const layout = ref<ReorderLayout | undefined>('grid');
    const activation = ref<ReorderActivation | undefined>('longPress');
    const density = ref<ReorderDensity | undefined>('dense');
    const disabled = ref<boolean | undefined>(true);
    const interactiveSelector = ref<string | undefined>('[data-ignore]');
    const { adapterState } = await mountUseReorderSurface({
      activation,
      density,
      disabled,
      interactiveSelector,
      layout,
    });

    expect(adapterState.layout?.value).toBe('grid');
    expect(adapterState.disabled?.value).toBe(true);
    expect(adapterState.interactiveSelector?.value).toBe('[data-ignore]');
    expect(adapterState.profile?.value).toMatchObject({
      activation: 'longPress',
      density: 'dense',
      layout: 'grid',
    });
  });

  it('scopes the adapter selector to explicit ignore zones under explicitIgnoreOnly', async () => {
    const interactiveSelector = ref<string | undefined>('button, a');
    const interactiveStrategy = ref<ReorderInteractiveStrategy | undefined>('explicitIgnoreOnly');
    const { adapterState } = await mountUseReorderSurface({
      interactiveSelector,
      interactiveStrategy,
    });

    expect(adapterState.interactiveSelector?.value).toBe(`[${REORDER_IGNORE_ATTRIBUTE}]`);
  });

  it('preserves the custom selector under the default blockInteractiveDescendants strategy', async () => {
    const interactiveSelector = ref<string | undefined>('button, a');
    const { adapterState } = await mountUseReorderSurface({ interactiveSelector });

    expect(adapterState.interactiveSelector?.value).toBe('button, a');
  });

  it('returns early for mismatched listener event payloads when handlers are called directly', async () => {
    const { api, listeners } = await mountUseReorderSurface();
    const pointerHandler = listeners.find((listener) => listener.event === 'pointerdown');
    const touchHandler = listeners.find((listener) => listener.event === 'touchstart');
    const mouseHandler = listeners.find((listener) => listener.event === 'mousedown');

    if (!pointerHandler || !touchHandler || !mouseHandler) {
      throw new Error('Expected pointer, touch, and mouse handlers to be registered');
    }

    const pointerEvent = new Event('pointerdown');
    Object.defineProperty(pointerEvent, 'pointerType', {
      value: 'touch',
      configurable: true,
    });
    Object.defineProperty(pointerEvent, 'target', {
      value: document.createElement('div'),
      configurable: true,
    });
    pointerHandler.handler(pointerEvent);

    pointerHandler.handler(new Event('click'));
    touchHandler.handler(new Event('keydown'));
    mouseHandler.handler(new Event('keydown'));

    expect(api.activeProfile.value.input).toBe('touch');
  });

  it('processes a direct pointer handler call with pointerType data', async () => {
    const { api, listeners } = await mountUseReorderSurface();
    const pointerHandler = listeners.find((listener) => listener.event === 'pointerdown');

    if (!pointerHandler) {
      throw new Error('Expected pointer handler to be registered');
    }

    const pointerEvent = new Event('pointerdown');
    Object.defineProperty(pointerEvent, 'pointerType', {
      value: 'touch',
      configurable: true,
    });
    Object.defineProperty(pointerEvent, 'target', {
      value: document.createElement('div'),
      configurable: true,
    });

    pointerHandler.handler(pointerEvent);

    expect(api.activeProfile.value.input).toBe('touch');
  });

  it('does not prevent direct clicks when the target is not a DOM node', async () => {
    const { adapterState, listeners } = await mountUseReorderSurface();
    const clickHandler = listeners.find((listener) => listener.event === 'click');

    if (!clickHandler || !adapterState.callbacks) {
      throw new Error('Expected click handler and adapter callbacks to be registered');
    }

    adapterState.callbacks.onStart?.({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    adapterState.callbacks.onChange?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });
    await adapterState.callbacks.onEnd?.({
      itemId: 'a',
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
    });

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const stopImmediatePropagation = vi.fn();

    const clickEvent = new Event('click', { cancelable: true });
    Object.defineProperty(clickEvent, 'preventDefault', {
      value: preventDefault,
      configurable: true,
    });
    Object.defineProperty(clickEvent, 'stopImmediatePropagation', {
      value: stopImmediatePropagation,
      configurable: true,
    });
    Object.defineProperty(clickEvent, 'stopPropagation', {
      value: stopPropagation,
      configurable: true,
    });
    Object.defineProperty(clickEvent, 'target', {
      value: 'not-a-node',
      configurable: true,
    });

    clickHandler.handler(clickEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(stopImmediatePropagation).not.toHaveBeenCalled();
  });
});
