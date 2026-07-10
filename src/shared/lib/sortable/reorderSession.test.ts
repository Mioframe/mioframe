import { computed, effectScope, nextTick, ref, type EffectScope, type Ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REORDER_IGNORE_ATTRIBUTE, REORDER_ITEM_ATTRIBUTE } from './constants';
import { createReorderSession, type ReorderSessionCallbacks } from './reorderSession';

/**
 * Stubs a fixed vertical rect on an element so jsdom's zeroed layout does not apply.
 * @param element - Element to stub.
 * @param top - Top edge in viewport coordinates.
 * @param height - Element height.
 */
const stubRect = (element: HTMLElement, top: number, height: number) => {
  element.getBoundingClientRect = (): DOMRect => ({
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
};

/**
 * Reads a row by index, failing fast instead of allowing a silent `undefined`.
 * @param rows - Rows returned by {@link mountSession}.
 * @param index - Row index to read.
 * @returns The row element at that index.
 */
const requireRow = (rows: readonly HTMLElement[], index = 0): HTMLElement => {
  const row = rows[index];

  if (!row) {
    throw new Error(`missing row at index ${index}`);
  }

  return row;
};

const createRow = (id: string, top: number, height = 40): HTMLElement => {
  const row = document.createElement('div');

  row.setAttribute(REORDER_ITEM_ATTRIBUTE, id);
  stubRect(row, top, height);
  return row;
};

const cleanupList: EffectScope[] = [];

const mountSession = (
  itemIds: string[],
  overrides: Partial<ReorderSessionCallbacks> = {},
  disabled: Ref<boolean> = ref(false),
) => {
  const scope = effectScope();
  const containerEl = document.createElement('div');

  document.body.appendChild(containerEl);
  stubRect(containerEl, 0, itemIds.length * 40);
  itemIds.forEach((id, index) => containerEl.appendChild(createRow(id, index * 40)));
  cleanupList.push(scope);

  const callbacks: ReorderSessionCallbacks = {
    getExpectedIds: () => itemIds,
    onActivate: vi.fn(),
    onOrderChange: vi.fn(),
    onCancel: vi.fn(),
    onEnd: vi.fn(),
    ...overrides,
  };

  const session = scope.run(() =>
    createReorderSession(ref(containerEl), {
      disabled: computed(() => disabled.value),
      callbacks,
    }),
  );

  if (!session) {
    throw new Error('Failed to create reorder session');
  }

  const rows = [...containerEl.children].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );

  return { session, containerEl, callbacks, rows };
};

const firePointer = (
  target: EventTarget,
  type: string,
  { pointerId = 1, clientX = 0, clientY = 0, pointerType = 'mouse', button = 0 } = {},
) => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      clientX,
      clientY,
      pointerType,
      button,
    }),
  );
};

const fireWindowPointer = (type: string, options: Parameters<typeof firePointer>[2] = {}) => {
  firePointer(window, type, options);
};

afterEach(() => {
  cleanupList.splice(0).forEach((scope) => {
    scope.stop();
  });
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('createReorderSession', () => {
  it('treats a press without movement as a plain click: no activation', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointerup', { clientY: 20 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('activates a mouse press once it clears the movement threshold', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 30 });

    expect(callbacks.onActivate).toHaveBeenCalledTimes(1);
    expect(callbacks.onActivate).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'a',
        orderedIds: ['a', 'b', 'c'],
        fromIndex: 0,
        input: 'pointer',
      }),
    );
  });

  it('does not activate a mouse press below the movement threshold', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 21 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('ignores the right mouse button', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20, button: 2 });
    fireWindowPointer('pointermove', { clientY: 60 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('activates a touch press after the long-press delay', () => {
    vi.useFakeTimers();

    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20, pointerType: 'touch' });

    expect(callbacks.onActivate).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(callbacks.onActivate).toHaveBeenCalledTimes(1);
    expect(callbacks.onActivate).toHaveBeenCalledWith(expect.objectContaining({ input: 'touch' }));
  });

  it('cancels a pending touch press when it moves beyond slop before the long press fires', () => {
    vi.useFakeTimers();

    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20, pointerType: 'touch' });
    fireWindowPointer('pointermove', { clientY: 40, pointerType: 'touch' });
    vi.runAllTimers();

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('ignores pointer events from a second pointer id during a pending press', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { pointerId: 1, clientY: 20 });
    fireWindowPointer('pointermove', { pointerId: 2, clientY: 200 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();

    fireWindowPointer('pointermove', { pointerId: 1, clientY: 60 });
    expect(callbacks.onActivate).toHaveBeenCalledTimes(1);
  });

  it('ignores pointer events from a second pointer id during an active drag', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { pointerId: 1, clientY: 20 });
    fireWindowPointer('pointermove', { pointerId: 1, clientY: 30 });

    fireWindowPointer('pointerup', { pointerId: 2 });
    expect(callbacks.onEnd).not.toHaveBeenCalled();

    fireWindowPointer('pointerup', { pointerId: 1 });
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
  });

  it('does not activate an empty or single-item surface', () => {
    const { rows, callbacks } = mountSession(['a']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 200 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('fails closed when the DOM order is inconsistent with the caller-reported order', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c'], {
      getExpectedIds: () => ['a', 'b'], // caller thinks there are only two items
    });

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 60 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('does not start a session while disabled', () => {
    const disabled = ref(true);
    const { rows, callbacks } = mountSession(['a', 'b', 'c'], {}, disabled);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 60 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('reports onOrderChange only once the dragged intent crosses the hysteresis margin', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    // Row 'a' is at top=0..40 (center 20), row 'b' at top=40..80 (center 60).
    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 30 }); // activates (threshold 4px)

    expect(callbacks.onActivate).toHaveBeenCalledTimes(1);

    // Small movement that keeps intent short of row b's hysteresis-adjusted boundary.
    fireWindowPointer('pointermove', { clientY: 35 });
    expect(callbacks.onOrderChange).not.toHaveBeenCalled();

    // Movement that clears row b's center plus the hysteresis margin.
    fireWindowPointer('pointermove', { clientY: 90 });
    expect(callbacks.onOrderChange).toHaveBeenCalledTimes(1);
    expect(callbacks.onOrderChange).toHaveBeenCalledWith(
      expect.objectContaining({ orderedIds: ['b', 'a', 'c'], targetIndex: 1 }),
    );
  });

  it('uses the drag anchor rather than raw pointer position for target-index intent', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    // Press near the bottom of row 'a' (top=0, height=40) and activate at clientY=48:
    // anchorOffset = 48 - 0 = 48, so intent = pointerY - 48 + 20 = pointerY - 28.
    firePointer(requireRow(rows), 'pointerdown', { clientY: 38 });
    fireWindowPointer('pointermove', { clientY: 48 }); // activates (10px >= 4px threshold)

    // Raw pointer at 62 would already be inside row b's box (40..80), but the anchored
    // intent center (62 - 28 = 34) is short of row b's hysteresis-adjusted boundary
    // (60 + 8 = 68), so no swap yet.
    fireWindowPointer('pointermove', { clientY: 62 });
    expect(callbacks.onOrderChange).not.toHaveBeenCalled();

    // Enough anchored travel to clear the boundary: pointerY=100 -> intent = 100-28=72.
    fireWindowPointer('pointermove', { clientY: 100 });
    expect(callbacks.onOrderChange).toHaveBeenCalledTimes(1);
  });

  it('reports onEnd with the final order on pointerup', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 30 }); // activates, anchorOffset=30
    fireWindowPointer('pointermove', { clientY: 90 }); // intent = 90-30+20=80, crosses row b
    fireWindowPointer('pointerup');

    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
    expect(callbacks.onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ orderedIds: ['b', 'a', 'c'], fromIndex: 0, toIndex: 1 }),
    );
  });

  it('reports onCancel then onEnd on pointercancel', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 30 });
    fireWindowPointer('pointercancel');

    expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
  });

  it('reports no session and no onEnd when a pending press is released before activation', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointerup');

    expect(callbacks.onActivate).not.toHaveBeenCalled();
    expect(callbacks.onEnd).not.toHaveBeenCalled();
  });

  it('does not start a session from a press inside an ignore zone', () => {
    const { rows, callbacks } = mountSession(['a', 'b', 'c']);
    const row = requireRow(rows);
    const ignoreZone = document.createElement('span');

    ignoreZone.setAttribute(REORDER_IGNORE_ATTRIBUTE, '');
    row.appendChild(ignoreZone);

    firePointer(ignoreZone, 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 60 });

    expect(callbacks.onActivate).not.toHaveBeenCalled();
  });

  it('prevents native dragstart on reorder items', () => {
    const { rows } = mountSession(['a', 'b', 'c']);
    const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true });

    requireRow(rows).dispatchEvent(dragStartEvent);

    expect(dragStartEvent.defaultPrevented).toBe(true);
  });

  it('refreshes rects and resumes intent tracking after Vue re-renders a reactive reorder', async () => {
    const { rows, containerEl, callbacks } = mountSession(['a', 'b', 'c']);

    firePointer(requireRow(rows), 'pointerdown', { clientY: 20 });
    fireWindowPointer('pointermove', { clientY: 30 });
    fireWindowPointer('pointermove', { clientY: 90 });

    expect(callbacks.onOrderChange).toHaveBeenCalledTimes(1);

    // Simulate Vue reactively re-rendering the swapped order: row 'a' now sits where
    // row 'b' used to be, and vice versa.
    containerEl.innerHTML = '';
    const newB = createRow('b', 0);
    const newA = createRow('a', 40);
    const newC = createRow('c', 80);

    containerEl.append(newB, newA, newC);

    await nextTick();

    // Further movement should now be evaluated against the refreshed DOM order instead
    // of stale pre-swap rects.
    fireWindowPointer('pointerup');

    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
    expect(callbacks.onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ orderedIds: ['b', 'a', 'c'] }),
    );
  });
});
