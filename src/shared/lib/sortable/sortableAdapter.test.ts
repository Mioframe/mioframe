import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { REORDER_IGNORE_ATTRIBUTE, REORDER_ITEM_ATTRIBUTE } from './constants';
import { createSortableAdapter } from './sortableAdapter';
import type { ReorderEngineEventPayload, ReorderInputProfile } from './reorderTypes';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildContainer = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <div ${REORDER_ITEM_ATTRIBUTE}="a">A<button ${REORDER_IGNORE_ATTRIBUTE}>menu</button></div>
    <div ${REORDER_ITEM_ATTRIBUTE}="b">B</div>
    <div ${REORDER_ITEM_ATTRIBUTE}="c">C</div>
  `;
  document.body.appendChild(container);
  return container;
};

const baseProfile: ReorderInputProfile = {
  input: 'pointer',
  layout: 'vertical',
  density: 'comfortable',
  activation: 'fullRowNative',
  delay: 0,
  moveThreshold: 4,
  suppressClickAfterDrag: true,
  forceFallback: true,
  fallbackOnBody: true,
  animation: 150,
  scrollSpeed: 14,
  scrollSensitivity: 36,
};

/**
 * SortableJS's own tap-start listener is bound to `pointerdown`/`pointermove` (not
 * `mousedown`/`touchstart`) whenever `PointerEvent` exists in the environment, which is
 * true in real Chromium as well as in this test environment. A drag session only
 * starts from real `PointerEvent` dispatch; plain `MouseEvent`/`TouchEvent` dispatch
 * never reaches it.
 * @param target - Element to dispatch the pointer-down gesture on.
 * @param root0 - Start and end Y coordinates for the simulated drag.
 */
const firePointerDrag = (target: HTMLElement, { fromY, toY }: { fromY: number; toY: number }) => {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: fromY,
      button: 0,
      pointerType: 'mouse',
    }),
  );
  document.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: toY,
      pointerType: 'mouse',
    }),
  );
};

/**
 * Reads the live SortableJS instance's runtime options for assertions. SortableJS's
 * own `Options` type only declares its own defaults loosely; the values these tests
 * check (`disabled`, `scroll`, `filter`, `direction`) are always present at runtime.
 * @param engine - Adapter instance whose live SortableJS options should be read.
 * @returns The live options record, or undefined when no instance exists yet.
 */
const getSortableOptions = (engine: ReturnType<typeof createSortableAdapter>) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- SortableJS's own Options type doesn't statically expose the reactive fields under test
  engine.sortable.value?.options as Record<string, unknown> | undefined;

const firePointerUp = (clientY: number) => {
  document.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY,
      button: 0,
      pointerType: 'mouse',
    }),
  );
};

describe('createSortableAdapter (real SortableJS engine)', () => {
  it('starts a drag from the row itself under the explicit-ignore-only filter (full-row native shape)', async () => {
    const container = buildContainer();
    const started: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      interactiveSelector: `[${REORDER_IGNORE_ATTRIBUTE}]`,
      profile: baseProfile,
      callbacks: {
        onStart: (payload) => started.push(payload),
      },
    });

    const rowA = container.querySelector(`[${REORDER_ITEM_ATTRIBUTE}="a"]`);
    if (!(rowA instanceof HTMLElement)) {
      throw new Error('missing row a');
    }

    firePointerDrag(rowA, { fromY: 10, toY: 30 });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(started).toHaveLength(1);

    // SortableJS tracks the active drag element in module-level state; ending the
    // session here keeps it from blocking the next test's `_onTapStart` guard
    // (`if (dragEl) return;`), since that state is shared across every instance in
    // this module.
    firePointerUp(30);
    await new Promise((resolve) => setTimeout(resolve, 20));

    document.body.removeChild(container);
  });

  it('blocks drag activation from an explicit ignore zone under the explicit-ignore-only filter', () => {
    const container = buildContainer();
    const started: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      interactiveSelector: `[${REORDER_IGNORE_ATTRIBUTE}]`,
      profile: baseProfile,
      callbacks: {
        onStart: (payload) => started.push(payload),
      },
    });

    const ignoreButton = container.querySelector(`[${REORDER_IGNORE_ATTRIBUTE}]`);
    if (!(ignoreButton instanceof HTMLElement)) {
      throw new Error('missing ignore button');
    }

    firePointerDrag(ignoreButton, { fromY: 10, toY: 30 });

    expect(started).toHaveLength(0);

    document.body.removeChild(container);
  });

  it('blocks drag activation from the row itself under blockInteractiveDescendants (default) filtering', () => {
    const container = buildContainer();
    const started: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      interactiveSelector: 'button, a, input, textarea, select, option, [contenteditable]',
      profile: { ...baseProfile, activation: 'immediate' },
      callbacks: {
        onStart: (payload) => started.push(payload),
      },
    });

    const button = container.querySelector('button');
    if (!(button instanceof HTMLElement)) {
      throw new Error('missing button');
    }

    firePointerDrag(button, { fromY: 10, toY: 30 });

    expect(started).toHaveLength(0);

    document.body.removeChild(container);
  });

  it('reports itemId, orderedIds, fromIndex, and toIndex on start and end', async () => {
    const container = buildContainer();
    const started: ReorderEngineEventPayload[] = [];
    const ended: ReorderEngineEventPayload[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      interactiveSelector: `[${REORDER_IGNORE_ATTRIBUTE}]`,
      profile: baseProfile,
      callbacks: {
        onStart: (payload) => started.push(payload),
        onEnd: (payload) => ended.push(payload),
      },
    });

    const rowA = container.querySelector(`[${REORDER_ITEM_ATTRIBUTE}="a"]`);
    if (!(rowA instanceof HTMLElement)) {
      throw new Error('missing row a');
    }

    firePointerDrag(rowA, { fromY: 10, toY: 30 });
    await wait(20);
    firePointerUp(30);
    await wait(20);

    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ itemId: 'a' });
    expect(started[0]?.orderedIds).toEqual(['a', 'b', 'c']);
    expect(typeof started[0]?.fromIndex).toBe('number');
    expect(typeof started[0]?.toIndex).toBe('number');

    expect(ended).toHaveLength(1);
    expect(ended[0]).toMatchObject({ itemId: 'a' });
    expect(ended[0]?.orderedIds).toEqual(['a', 'b', 'c']);

    document.body.removeChild(container);
  });

  it('cancels an active drag session through cancel() and allows a fresh drag afterward', async () => {
    const container = buildContainer();
    const started: ReorderEngineEventPayload[] = [];

    const engine = createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      interactiveSelector: `[${REORDER_IGNORE_ATTRIBUTE}]`,
      profile: baseProfile,
      callbacks: {
        onStart: (payload) => started.push(payload),
      },
    });

    const rowA = container.querySelector(`[${REORDER_ITEM_ATTRIBUTE}="a"]`);
    if (!(rowA instanceof HTMLElement)) {
      throw new Error('missing row a');
    }

    firePointerDrag(rowA, { fromY: 10, toY: 30 });
    await wait(20);
    expect(started).toHaveLength(1);

    // cancel() drops SortableJS's internal session state (module-level `dragEl` etc.)
    // synchronously; it does not dispatch SortableJS's own 'end' event (that dispatch
    // is gated behind a real DOM event object, which cancel() does not pass through),
    // so onEnd is not the observable signal here. A subsequent drag starting cleanly
    // is what proves the session was actually released rather than left stuck.
    expect(() => {
      engine.cancel();
    }).not.toThrow();

    firePointerDrag(rowA, { fromY: 10, toY: 30 });
    await wait(20);

    expect(started).toHaveLength(2);

    firePointerUp(30);
    await wait(20);

    document.body.removeChild(container);
  });

  it('cancel() is a no-op when no drag session is active', () => {
    const container = buildContainer();
    const engine = createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });

    expect(() => {
      engine.cancel();
    }).not.toThrow();

    document.body.removeChild(container);
  });

  it('reorders the tracked array through sort()', () => {
    const container = buildContainer();
    const engine = createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });

    expect(engine.toArray()).toEqual(['a', 'b', 'c']);

    engine.sort(['b', 'a', 'c']);

    expect(engine.toArray()).toEqual(['b', 'a', 'c']);

    document.body.removeChild(container);
  });

  it('calls onCancel and drops the session when Escape is pressed on the container', () => {
    const container = buildContainer();
    const cancelled: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {
        onCancel: () => cancelled.push(true),
      },
    });

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cancelled).toHaveLength(1);

    document.body.removeChild(container);
  });

  it('does not call onCancel for a non-Escape key', () => {
    const container = buildContainer();
    const cancelled: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {
        onCancel: () => cancelled.push(true),
      },
    });

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(cancelled).toHaveLength(0);

    document.body.removeChild(container);
  });

  it('does not call onCancel for a non-keyboard event named keydown', () => {
    const container = buildContainer();
    const cancelled: unknown[] = [];

    createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {
        onCancel: () => cancelled.push(true),
      },
    });

    container.dispatchEvent(new Event('keydown', { bubbles: true }));

    expect(cancelled).toHaveLength(0);

    document.body.removeChild(container);
  });

  it('destroys the SortableJS instance and stops tracking the container', () => {
    const container = buildContainer();
    const engine = createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });

    expect(engine.sortable.value).toBeDefined();

    engine.destroy();

    expect(engine.sortable.value).toBeUndefined();
    expect(engine.toArray()).toEqual([]);

    document.body.removeChild(container);
  });

  it('destroys the previous instance and creates a new one when the container ref changes', async () => {
    const container = buildContainer();
    const nextContainer = buildContainer();
    const containerRef = ref<HTMLElement | null>(container);

    const engine = createSortableAdapter(containerRef, {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });

    expect(engine.sortable.value?.el).toBe(container);

    // The container watcher uses the default ('pre') flush timing, not `sync`, so the
    // instance swap is queued rather than applied synchronously.
    containerRef.value = nextContainer;
    await nextTick();

    expect(engine.sortable.value?.el).toBe(nextContainer);

    containerRef.value = null;
    await nextTick();

    expect(engine.sortable.value).toBeUndefined();

    document.body.removeChild(container);
    document.body.removeChild(nextContainer);
  });

  it('applies reactive disabled, interactiveSelector, and scrollContainer updates', async () => {
    const container = buildContainer();
    const scrollContainer = document.createElement('div');
    document.body.appendChild(scrollContainer);

    const disabled = ref(false);
    const interactiveSelector = ref<string | undefined>(`[${REORDER_IGNORE_ATTRIBUTE}]`);
    const scrollContainerRef = ref<HTMLElement | null>(null);

    const engine = createSortableAdapter(ref(container), {
      layout: 'vertical',
      disabled,
      interactiveSelector,
      profile: baseProfile,
      scrollContainer: scrollContainerRef,
      callbacks: {},
    });

    const options = () => getSortableOptions(engine);

    expect(options()?.disabled).toBe(false);
    expect(options()?.scroll).toBe(true);
    expect(options()?.filter).toContain(REORDER_IGNORE_ATTRIBUTE);

    disabled.value = true;
    expect(options()?.disabled).toBe(true);

    interactiveSelector.value = 'button';
    expect(options()?.filter).toContain('button');
    expect(options()?.filter).not.toContain(REORDER_IGNORE_ATTRIBUTE);

    scrollContainerRef.value = scrollContainer;
    await nextTick();
    expect(options()?.scroll).toBe(scrollContainer);

    document.body.removeChild(container);
    document.body.removeChild(scrollContainer);
  });

  it('resolves the direction option from layout at creation time', () => {
    const verticalContainer = buildContainer();
    const gridContainer = buildContainer();

    const verticalEngine = createSortableAdapter(ref(verticalContainer), {
      layout: 'vertical',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });
    const gridEngine = createSortableAdapter(ref(gridContainer), {
      layout: 'grid',
      disabled: false,
      profile: baseProfile,
      callbacks: {},
    });

    expect(getSortableOptions(verticalEngine)?.direction).toBe('vertical');
    // `grid` has no native SortableJS direction; the adapter leaves it undefined so
    // SortableJS falls back to its own auto-detection instead of forcing an axis.
    expect(getSortableOptions(gridEngine)?.direction).toBeUndefined();

    document.body.removeChild(verticalContainer);
    document.body.removeChild(gridContainer);
  });
});
