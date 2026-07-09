import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type EffectScope } from 'vue';
import {
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
  REORDER_ITEM_SLOT_CLASS,
  REORDER_OVERLAY_CLASS,
  REORDER_SURFACE_ACTIVE_CLASS,
} from './constants';
import { createReorderEngine } from './reorderEngine';
import { REORDER_TOUCH_LONG_PRESS_MS } from './reorderInput';
import type { ReorderEngineCallbacks } from './reorderTypes';

const cleanupList: EffectScope[] = [];

const ROW_HEIGHT = 56;
const ROW_GAP = 8;

// Builds a vertical three-row surface with stubbed layout geometry.
const mountEngine = ({
  disabled = ref(false),
  callbacks = {},
  ids = ['a', 'b', 'c'],
}: {
  disabled?: ReturnType<typeof ref<boolean>>;
  callbacks?: ReorderEngineCallbacks;
  ids?: string[];
} = {}) => {
  const containerEl = document.createElement('div');

  document.body.appendChild(containerEl);
  vi.spyOn(containerEl, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ x: 0, y: 0, width: 360, height: ids.length * (ROW_HEIGHT + ROW_GAP) }),
  );

  const rows = ids.map((id, index) => {
    const row = document.createElement('div');

    row.setAttribute(REORDER_ITEM_ATTRIBUTE, id);
    containerEl.appendChild(row);
    vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({
        x: 0,
        y: index * (ROW_HEIGHT + ROW_GAP),
        width: 360,
        height: ROW_HEIGHT,
      }),
    );

    return row;
  });

  const scope = effectScope();

  cleanupList.push(scope);

  const engine = scope.run(() =>
    createReorderEngine(ref(containerEl), {
      disabled: () => Boolean(disabled.value),
      callbacks,
    }),
  );

  if (!engine) {
    throw new Error('Failed to mount reorder engine');
  }

  return { containerEl, rows, engine, disabled };
};

const pointerEvent = (
  type: string,
  {
    x = 0,
    y = 0,
    pointerType = 'mouse',
    pointerId = 1,
    button = 0,
  }: { x?: number; y?: number; pointerType?: string; pointerId?: number; button?: number } = {},
) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerType,
    pointerId,
    button,
  });

const queryOverlay = () => document.body.querySelector(`.${REORDER_OVERLAY_CLASS}`);

const rowAt = (rows: readonly HTMLElement[], index: number): HTMLElement => {
  const row = rows[index];

  if (!row) {
    throw new Error(`missing fixture row at index ${index}`);
  }

  return row;
};

afterEach(() => {
  cleanupList.splice(0).forEach((scope) => {
    scope.stop();
  });
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('createReorderEngine', () => {
  it('activates a mouse session only after the movement threshold and commits the moved order', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { containerEl, rows } = mountEngine({ callbacks: { onStart, onEnd } });
    const row = rowAt(rows, 0);

    row.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 29 }));

    expect(onStart).not.toHaveBeenCalled();

    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 40 }));

    expect(onStart).toHaveBeenCalledWith({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'pointer',
    });
    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVE_CLASS)).toBe(true);
    expect(row.classList.contains(REORDER_ITEM_SLOT_CLASS)).toBe(true);
    expect(queryOverlay()).not.toBeNull();

    // Travel past the midpoints of rows b and c.
    window.dispatchEvent(
      pointerEvent('pointermove', { x: 100, y: 28 + 2 * (ROW_HEIGHT + ROW_GAP) }),
    );
    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 28 + 2 * (ROW_HEIGHT + ROW_GAP) }));

    expect(onEnd).toHaveBeenCalledWith({
      orderedIds: ['b', 'c', 'a'],
      fromIndex: 0,
      toIndex: 2,
    });
    expect(containerEl.classList.contains(REORDER_SURFACE_ACTIVE_CLASS)).toBe(false);
    expect(row.classList.contains(REORDER_ITEM_SLOT_CLASS)).toBe(false);
    expect(queryOverlay()).toBeNull();
  });

  it('shifts siblings while dragging and clears their transforms at session end', () => {
    const { rows } = mountEngine();
    const row = rowAt(rows, 0);

    row.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 28 + ROW_HEIGHT + ROW_GAP }));

    expect(rowAt(rows, 1).style.transform).toContain(`-${ROW_HEIGHT + ROW_GAP}px`);
    expect(rowAt(rows, 2).style.transform).toBe('');

    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 28 + ROW_HEIGHT + ROW_GAP }));

    expect(rowAt(rows, 1).style.transform).toBe('');
  });

  it('treats a mouse press without threshold movement as a plain click', () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { rows } = mountEngine({ callbacks: { onStart, onEnd } });

    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 101, y: 29 }));
    window.dispatchEvent(pointerEvent('pointerup', { x: 101, y: 29 }));

    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    expect(queryOverlay()).toBeNull();
  });

  it('does not start a session from an explicit ignore zone or a non-primary button', () => {
    const onStart = vi.fn();
    const { rows } = mountEngine({ callbacks: { onStart } });
    const ignoreZone = document.createElement('span');

    ignoreZone.setAttribute(REORDER_IGNORE_ATTRIBUTE, '');
    rowAt(rows, 0).appendChild(ignoreZone);

    ignoreZone.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 100 }));

    expect(onStart).not.toHaveBeenCalled();

    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28, button: 2 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 100 }));

    expect(onStart).not.toHaveBeenCalled();
  });

  it('gates touch activation behind the long press and cancels it on early movement', () => {
    vi.useFakeTimers();

    const onStart = vi.fn();
    const { rows } = mountEngine({ callbacks: { onStart } });

    // Quick vertical movement before the long press: scrolling, not reorder.
    rowAt(rows, 0).dispatchEvent(
      pointerEvent('pointerdown', { x: 100, y: 28, pointerType: 'touch' }),
    );
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 80, pointerType: 'touch' }));
    vi.advanceTimersByTime(REORDER_TOUCH_LONG_PRESS_MS + 50);

    expect(onStart).not.toHaveBeenCalled();

    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 80, pointerType: 'touch' }));

    // A held press activates after the long-press delay.
    rowAt(rows, 0).dispatchEvent(
      pointerEvent('pointerdown', { x: 100, y: 28, pointerType: 'touch' }),
    );
    vi.advanceTimersByTime(REORDER_TOUCH_LONG_PRESS_MS + 10);

    expect(onStart).toHaveBeenCalledWith({
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      input: 'touch',
    });

    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 28, pointerType: 'touch' }));
  });

  it('rolls the session back on pointercancel and on external cancel()', () => {
    const onCancel = vi.fn();
    const onEnd = vi.fn();
    const { engine, rows } = mountEngine({ callbacks: { onCancel, onEnd } });

    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 120 }));
    window.dispatchEvent(pointerEvent('pointercancel', { x: 100, y: 120 }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    expect(queryOverlay()).toBeNull();

    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 120 }));
    engine.cancel();

    expect(onEnd).toHaveBeenLastCalledWith({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
    expect(queryOverlay()).toBeNull();
  });

  it('does not start sessions while disabled and cancels an active session when disabled flips on', async () => {
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const disabled = ref<boolean>(false);
    const { rows } = mountEngine({ callbacks: { onStart, onEnd }, disabled });

    disabled.value = true;
    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 120 }));

    expect(onStart).not.toHaveBeenCalled();

    disabled.value = false;
    await Promise.resolve();
    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 120 }));

    expect(onStart).toHaveBeenCalledTimes(1);

    disabled.value = true;
    await Promise.resolve();

    expect(onEnd).toHaveBeenCalledWith({
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
    });
  });

  it('prevents native dragstart while a press or session is active', () => {
    const { containerEl, rows } = mountEngine();

    rowAt(rows, 0).dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));

    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });

    rowAt(rows, 0).dispatchEvent(dragStart);

    expect(dragStart.defaultPrevented).toBe(true);

    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 28 }));

    // A dragstart from a reorder item is blocked even without an engine press.
    const idleDragStart = new Event('dragstart', { bubbles: true, cancelable: true });

    rowAt(rows, 1).dispatchEvent(idleDragStart);

    expect(idleDragStart.defaultPrevented).toBe(true);

    // Content outside reorder items keeps its native drag behavior.
    const outside = document.createElement('span');

    containerEl.appendChild(outside);

    const outsideDragStart = new Event('dragstart', { bubbles: true, cancelable: true });

    outside.dispatchEvent(outsideDragStart);

    expect(outsideDragStart.defaultPrevented).toBe(false);
  });

  it('lifts the item into a body-mounted overlay without a second collection item', () => {
    const { rows } = mountEngine();
    const row = rowAt(rows, 0);

    row.textContent = 'view one';
    row.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 28 }));
    window.dispatchEvent(pointerEvent('pointermove', { x: 100, y: 120 }));

    const overlay = queryOverlay();

    expect(overlay).not.toBeNull();
    expect(overlay?.parentElement).toBe(document.body);
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    expect(overlay?.textContent).toContain('view one');
    // The clone must not read as another reorder item.
    expect(overlay?.querySelector(`[${REORDER_ITEM_ATTRIBUTE}]`)).toBeNull();
    expect(document.querySelectorAll(`[${REORDER_ITEM_ATTRIBUTE}]`)).toHaveLength(3);

    window.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 120 }));

    expect(queryOverlay()).toBeNull();
  });
});
