import { unrefElement, useEventListener, type MaybeElementRef } from '@vueuse/core';
import { computed, nextTick, toValue, type MaybeRefOrGetter } from 'vue';
import {
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
  REORDER_SURFACE_ACTIVE_CLASS,
} from './constants';
import { createReorderAutoScroll, type ReorderAutoScroll } from './reorderAutoScroll';
import { getReorderVisibleBounds } from './reorderBounds';
import {
  getDragAnchorOffset,
  getDraggedIntentCenter,
  getReorderTargetIndex,
  isReorderSessionModelConsistent,
  moveReorderListItem,
  type ReorderItemRect,
} from './reorderGeometry';
import {
  getReorderInputFromPointerType,
  REORDER_POINTER_MOVE_THRESHOLD,
  REORDER_TOUCH_LONG_PRESS_MS,
  REORDER_TOUCH_MOVE_SLOP,
  type ReorderInput,
} from './reorderInput';
import { suspendAncestorScrollSnap, type RestoreAncestorScrollSnap } from './reorderScrollSnap';

/** Payload reported when a pending press activates into a reorder session. */
export interface ReorderSessionActivatePayload {
  /** Id of the item being dragged. */
  itemId: string;
  /** Ordered ids read from the DOM at activation. */
  orderedIds: string[];
  /** Index of the dragged item at activation. */
  fromIndex: number;
  /** Input source that activated the session. */
  input: ReorderInput;
}

/** Payload reported whenever the target index changes during an active session. */
export interface ReorderSessionOrderChangePayload {
  /** Full ordered ids after moving the dragged item to its new slot. */
  orderedIds: string[];
  /** The dragged item's new slot. */
  targetIndex: number;
  /** Rects measured immediately before this swap, for the caller's FLIP animation. */
  previousRects: ReorderItemRect[];
}

/** Payload reported when an active session ends, committed or not. */
export interface ReorderSessionEndPayload {
  /** Ordered ids as last reported by the session. */
  orderedIds: string[];
  /** Index of the dragged item at activation. */
  fromIndex: number;
  /** Index the dragged item occupies when the session ends. */
  toIndex: number;
}

/** Callbacks invoked by the reorder session as it progresses through its lifecycle. */
export interface ReorderSessionCallbacks {
  /** Reads the caller's authoritative display order, used to validate DOM state at activation. */
  getExpectedIds: () => readonly string[];
  /** Called once a pending press clears its activation gate. */
  onActivate: (payload: ReorderSessionActivatePayload) => unknown;
  /** Called whenever the dragged item's target slot changes. */
  onOrderChange: (payload: ReorderSessionOrderChangePayload) => unknown;
  /** Called before `onEnd` when the session is cancelled instead of dropped normally. */
  onCancel: () => unknown;
  /** Called when the session ends, after DOM cleanup. May be async; the session does not await it. */
  onEnd: (payload: ReorderSessionEndPayload) => unknown;
}

/** Options accepted by {@link createReorderSession}. */
export interface CreateReorderSessionOptions {
  /** Disables new sessions and cancels an active one when truthy. */
  disabled: MaybeRefOrGetter<boolean>;
  /** Session lifecycle callbacks consumed by the reorder surface composable. */
  callbacks: ReorderSessionCallbacks;
}

/** Press tracked between pointerdown and reorder activation. */
interface PendingPress {
  pointerId: number;
  itemEl: HTMLElement;
  itemId: string;
  input: ReorderInput;
  startClientX: number;
  startClientY: number;
  lastClientY: number;
  longPressTimer: ReturnType<typeof setTimeout> | undefined;
}

/** Geometry and DOM handles owned by an active reorder session. */
interface ActiveSession {
  pointerId: number;
  itemId: string;
  input: ReorderInput;
  containerEl: HTMLElement;
  itemEls: HTMLElement[];
  ids: string[];
  rects: ReorderItemRect[];
  fromIndex: number;
  currentIndex: number;
  anchorOffset: number;
  lastClientY: number;
  autoScroll: ReorderAutoScroll;
  restoreAncestorScrollSnap: RestoreAncestorScrollSnap;
}

const reorderItemSelector = `[${REORDER_ITEM_ATTRIBUTE}]`;
const reorderIgnoreSelector = `[${REORDER_IGNORE_ATTRIBUTE}]`;

/**
 * Reads the reorderable item element under an event target, skipping ignore zones.
 * @param target - Raw event target.
 * @param containerEl - Reorder surface container.
 * @returns The item element owning the press, or `undefined` when the press must not
 * start reorder.
 */
const findReorderItemForPress = (
  target: EventTarget | null,
  containerEl: HTMLElement,
): HTMLElement | undefined => {
  if (!(target instanceof Element)) {
    return undefined;
  }

  if (target.closest(reorderIgnoreSelector) !== null) {
    return undefined;
  }

  const itemEl = target.closest(reorderItemSelector);

  if (!(itemEl instanceof HTMLElement) || !containerEl.contains(itemEl)) {
    return undefined;
  }

  return itemEl;
};

/**
 * Measures the current reorder items inside a container in DOM order.
 * @param containerEl - Reorder surface container.
 * @returns Elements, ids, and rects in current DOM order.
 */
const measureReorderItems = (
  containerEl: HTMLElement,
): { itemEls: HTMLElement[]; ids: string[]; rects: ReorderItemRect[] } => {
  const itemEls = [...containerEl.querySelectorAll(reorderItemSelector)].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
  const ids = itemEls.map((element) => element.getAttribute(REORDER_ITEM_ATTRIBUTE) ?? '');
  const rects = itemEls.map((element, index): ReorderItemRect => {
    const rect = element.getBoundingClientRect();

    return { id: ids[index] ?? '', top: rect.top, height: rect.height };
  });

  return { itemEls, ids, rects };
};

/**
 * Creates the pointer/touch reorder session for one surface container.
 *
 * The session owns input recognition only: activation gating (movement threshold for
 * mouse, long press for touch/pen), rect measurement, hysteresis-based target-index
 * tracking, container-local auto-scroll, and cleanup. It never writes to the DOM order,
 * never clones nodes, and never renders a lifted overlay — it only reports target-index
 * changes through {@link ReorderSessionCallbacks} so the caller can update Vue-reactive
 * state and let Vue own the actual re-render.
 * @param container - Reorder surface container element or component reference.
 * @param options - Session configuration and callbacks.
 * @returns Session handle exposing external cancellation.
 */
export const createReorderSession = (
  container: MaybeElementRef,
  { disabled, callbacks }: CreateReorderSessionOptions,
) => {
  const containerElRef = computed(() => unrefElement(container));

  let pending: PendingPress | undefined;
  let active: ActiveSession | undefined;

  const getContainerEl = (): HTMLElement | undefined =>
    containerElRef.value instanceof HTMLElement ? containerElRef.value : undefined;

  const removeWindowListeners = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('pointermove', onWindowPointerMove, true);
    window.removeEventListener('pointerup', onWindowPointerUp, true);
    window.removeEventListener('pointercancel', onWindowPointerCancel, true);
  };

  const addWindowListeners = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('pointermove', onWindowPointerMove, true);
    window.addEventListener('pointerup', onWindowPointerUp, true);
    window.addEventListener('pointercancel', onWindowPointerCancel, true);
  };

  /** Drops a press that never became a reorder session. */
  const abandonPending = () => {
    if (!pending) {
      return;
    }

    if (pending.longPressTimer !== undefined) {
      clearTimeout(pending.longPressTimer);
    }

    pending = undefined;
    removeWindowListeners();
  };

  /** Re-maps rects for the cached elements without requerying the DOM (cheap, for scroll steps). */
  const refreshRectsInPlace = () => {
    const session = active;

    if (!session) {
      return;
    }

    session.rects = session.itemEls.map((element, index): ReorderItemRect => {
      const rect = element.getBoundingClientRect();

      return { id: session.ids[index] ?? '', top: rect.top, height: rect.height };
    });
  };

  /** Re-queries the DOM after Vue has rendered a reactive reorder. */
  const refreshRectsFromDom = () => {
    if (!active) {
      return;
    }

    const containerEl = active.containerEl;
    const measured = measureReorderItems(containerEl);
    const nextIndex = measured.ids.indexOf(active.itemId);

    if (nextIndex < 0) {
      cancel();
      return;
    }

    active.itemEls = measured.itemEls;
    active.ids = measured.ids;
    active.rects = measured.rects;
    active.currentIndex = nextIndex;
    evaluateIntent();
  };

  /** Recomputes drag intent from the latest pointer position and rects, and swaps on threshold. */
  const evaluateIntent = () => {
    if (!active) {
      return;
    }

    const session = active;
    const draggedRect = session.rects[session.currentIndex];

    if (!draggedRect) {
      cancel();
      return;
    }

    const visibleBounds = getReorderVisibleBounds(session.containerEl);
    const draggedCenter = getDraggedIntentCenter({
      pointerY: session.lastClientY,
      anchorOffset: session.anchorOffset,
      draggedHeight: draggedRect.height,
      visibleBounds,
    });
    const targetIndex = getReorderTargetIndex({
      rects: session.rects,
      currentIndex: session.currentIndex,
      draggedCenter,
    });

    if (targetIndex !== session.currentIndex) {
      const previousRects = session.rects;
      const nextIds = moveReorderListItem(session.ids, session.currentIndex, targetIndex);

      session.ids = nextIds;
      session.currentIndex = targetIndex;
      callbacks.onOrderChange({ orderedIds: [...nextIds], targetIndex, previousRects });
      void nextTick(refreshRectsFromDom);
    }

    session.autoScroll.update(session.lastClientY);
  };

  /** Promotes the pending press into an active reorder session. */
  const activate = () => {
    const containerEl = getContainerEl();

    if (!pending || active || !containerEl) {
      abandonPending();
      return;
    }

    const press = pending;

    if (press.longPressTimer !== undefined) {
      clearTimeout(press.longPressTimer);
    }

    const measured = measureReorderItems(containerEl);
    const fromIndex = measured.itemEls.indexOf(press.itemEl);

    if (
      fromIndex < 0 ||
      measured.itemEls.length < 2 ||
      !isReorderSessionModelConsistent(measured.ids, callbacks.getExpectedIds())
    ) {
      abandonPending();
      return;
    }

    const draggedRect = measured.rects[fromIndex];

    if (!draggedRect) {
      abandonPending();
      return;
    }

    pending = undefined;
    active = {
      pointerId: press.pointerId,
      itemId: press.itemId,
      input: press.input,
      containerEl,
      itemEls: measured.itemEls,
      ids: measured.ids,
      rects: measured.rects,
      fromIndex,
      currentIndex: fromIndex,
      anchorOffset: getDragAnchorOffset(press.lastClientY, draggedRect),
      lastClientY: press.lastClientY,
      autoScroll: createReorderAutoScroll({
        containerEl,
        onScrollStep: () => {
          refreshRectsInPlace();
          evaluateIntent();
        },
      }),
      restoreAncestorScrollSnap: suspendAncestorScrollSnap(containerEl),
    };

    containerEl.classList.add(REORDER_SURFACE_ACTIVE_CLASS);

    // No setPointerCapture: the window-level capturing listeners already track this
    // session regardless of which element the pointer is over. Capturing the dragged
    // element would be actively wrong here — reactive reorder physically relocates that
    // element in the DOM mid-session, and browsers can react to a captured element
    // moving (or, on touch, cancel the gesture outright) by forcing an ancestor scroll
    // container to a completely different position to keep it "in view".
    callbacks.onActivate({
      itemId: press.itemId,
      orderedIds: [...measured.ids],
      fromIndex,
      input: press.input,
    });

    evaluateIntent();
  };

  /** Tears down the active session and reports its final order. */
  const finish = () => {
    if (!active) {
      return;
    }

    const session = active;

    active = undefined;
    removeWindowListeners();
    session.autoScroll.stop();
    session.restoreAncestorScrollSnap();
    session.containerEl.classList.remove(REORDER_SURFACE_ACTIVE_CLASS);

    callbacks.onEnd({
      orderedIds: [...session.ids],
      fromIndex: session.fromIndex,
      toIndex: session.currentIndex,
    });
  };

  const onWindowPointerMove = (event: PointerEvent) => {
    if (active) {
      if (event.pointerId !== active.pointerId) {
        return;
      }

      active.lastClientY = event.clientY;
      evaluateIntent();
      return;
    }

    if (!pending || event.pointerId !== pending.pointerId) {
      return;
    }

    pending.lastClientY = event.clientY;

    const travel = Math.hypot(
      event.clientX - pending.startClientX,
      event.clientY - pending.startClientY,
    );

    if (pending.input === 'pointer') {
      if (travel >= REORDER_POINTER_MOVE_THRESHOLD) {
        activate();
      }

      return;
    }

    // Touch/pen: movement beyond the slop before the long press fires means the user is
    // scrolling, not reordering.
    if (travel > REORDER_TOUCH_MOVE_SLOP) {
      abandonPending();
    }
  };

  const onWindowPointerUp = (event: PointerEvent) => {
    if (active) {
      if (event.pointerId === active.pointerId) {
        finish();
      }

      return;
    }

    if (pending && event.pointerId === pending.pointerId) {
      abandonPending();
    }
  };

  const onWindowPointerCancel = (event: PointerEvent) => {
    if (active) {
      if (event.pointerId === active.pointerId) {
        callbacks.onCancel();
        finish();
      }

      return;
    }

    if (pending && event.pointerId === pending.pointerId) {
      abandonPending();
    }
  };

  useEventListener(containerElRef, 'pointerdown', (event) => {
    if (!(event instanceof PointerEvent) || pending || active || toValue(disabled)) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const containerEl = getContainerEl();

    if (!containerEl) {
      return;
    }

    const itemEl = findReorderItemForPress(event.target, containerEl);
    const itemId = itemEl?.getAttribute(REORDER_ITEM_ATTRIBUTE);

    if (!itemEl || !itemId) {
      return;
    }

    if (containerEl.querySelectorAll(reorderItemSelector).length < 2) {
      return;
    }

    const input = getReorderInputFromPointerType(event.pointerType);

    pending = {
      pointerId: event.pointerId,
      itemEl,
      itemId,
      input,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientY: event.clientY,
      longPressTimer:
        input === 'touch' ? setTimeout(activate, REORDER_TOUCH_LONG_PRESS_MS) : undefined,
    };

    addWindowListeners();
  });

  // Reorder items must never enter native browser drag-and-drop: no browser drag image
  // and no native DnD session may compete with the reactive session.
  useEventListener(containerElRef, 'dragstart', (event) => {
    const containerEl = getContainerEl();

    if (pending || active || (containerEl && findReorderItemForPress(event.target, containerEl))) {
      event.preventDefault();
    }
  });

  const cancel = () => {
    abandonPending();
    finish();
  };

  return {
    /**
     * Cancels the current press or active session.
     *
     * This only tears down the session's own pointer/DOM bookkeeping and reports the
     * final order truthfully through `onEnd` — it does not know whether the caller wants
     * a rollback. Callers driving programmatic cancellation (disabled, Escape, external
     * order changes, unmount) must request rollback on the shared state first so the
     * reported order is discarded instead of committed.
     */
    cancel,
  };
};
