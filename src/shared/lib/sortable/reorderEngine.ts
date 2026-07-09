import { unrefElement, useEventListener, type MaybeElementRef } from '@vueuse/core';
import { computed, onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue';
import {
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
  REORDER_ITEM_SLOT_CLASS,
  REORDER_SURFACE_ACTIVE_CLASS,
} from './constants';
import { createReorderAutoScroll, type ReorderAutoScroll } from './reorderAutoScroll';
import {
  clampReorderDragOffset,
  getReorderAxis,
  getReorderRectCenter,
  getReorderSiblingOffset,
  getReorderSlotStep,
  getReorderTargetIndex,
  moveReorderListItem,
  type ReorderAxis,
  type ReorderItemRect,
} from './reorderGeometry';
import {
  getReorderInputFromPointerType,
  REORDER_POINTER_MOVE_THRESHOLD,
  REORDER_TOUCH_LONG_PRESS_MS,
  REORDER_TOUCH_MOVE_SLOP,
  type ReorderInput,
} from './reorderInput';
import { createReorderOverlay, type ReorderOverlay } from './reorderOverlay';
import type { ReorderEngineCallbacks } from './reorderTypes';

/** Options accepted by {@link createReorderEngine}. */
export interface CreateReorderEngineOptions {
  /** Disables new reorder sessions and cancels an active one when truthy. */
  disabled: MaybeRefOrGetter<boolean>;
  /** Scrollable ancestor driven by edge auto-scroll; defaults to the container itself. */
  scrollContainer?: MaybeElementRef;
  /** Session lifecycle callbacks consumed by the reorder surface. */
  callbacks: ReorderEngineCallbacks;
}

/** Press tracked between pointerdown and reorder activation. */
interface PendingSession {
  pointerId: number;
  itemEl: HTMLElement;
  itemId: string;
  input: ReorderInput;
  startClientX: number;
  startClientY: number;
  lastClientX: number;
  lastClientY: number;
  longPressTimer: ReturnType<typeof setTimeout> | undefined;
}

/** Geometry and DOM handles owned by an active reorder session. */
interface ActiveSession extends PendingSession {
  containerEl: HTMLElement;
  scrollEl: HTMLElement;
  itemEls: HTMLElement[];
  ids: string[];
  rects: ReorderItemRect[];
  axis: ReorderAxis;
  slotStep: number;
  fromIndex: number;
  targetIndex: number;
  baseScrollLeft: number;
  baseScrollTop: number;
  overlay: ReorderOverlay | undefined;
  autoScroll: ReorderAutoScroll;
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
 * Creates the geometry-based pointer reorder engine for one surface container.
 *
 * The engine owns the full input session: activation gating (movement threshold for
 * mouse, long press for touch/pen), rect measurement, target-index tracking, sibling
 * shift transforms, the lifted overlay, edge auto-scroll, and cleanup. It reports
 * session boundaries through {@link ReorderEngineCallbacks}; persistence and optimistic
 * state stay with the caller.
 * @param container - Reorder surface container element or component reference.
 * @param options - Engine configuration and callbacks.
 * @returns Engine handle exposing external cancellation.
 */
export const createReorderEngine = (
  container: MaybeElementRef,
  { disabled, scrollContainer, callbacks }: CreateReorderEngineOptions,
) => {
  const containerElRef = computed(() => unrefElement(container));
  const scrollContainerElRef = computed(() => unrefElement(scrollContainer));

  let pending: PendingSession | undefined;
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

  /**
   * Applies the latest pointer position to overlay travel, sibling shifts, target
   * index, and auto-scroll.
   */
  const applyMove = () => {
    if (!active) {
      return;
    }

    const session = active;
    const scrollDeltaX = session.scrollEl.scrollLeft - session.baseScrollLeft;
    const scrollDeltaY = session.scrollEl.scrollTop - session.baseScrollTop;
    const pointerDeltaMain =
      session.axis === 'y'
        ? session.lastClientY - session.startClientY + scrollDeltaY
        : session.lastClientX - session.startClientX + scrollDeltaX;
    const clampedOffset = clampReorderDragOffset({
      rects: session.rects,
      fromIndex: session.fromIndex,
      desiredOffset: pointerDeltaMain,
      axis: session.axis,
    });

    // The overlay is fixed-positioned: convert the measurement-space travel back into
    // viewport coordinates and keep the cross axis locked to the collection.
    session.overlay?.move(
      session.axis === 'y' ? -scrollDeltaX : clampedOffset - scrollDeltaX,
      session.axis === 'y' ? clampedOffset - scrollDeltaY : -scrollDeltaY,
    );

    const draggedRect = session.rects[session.fromIndex];

    if (!draggedRect) {
      return;
    }

    const draggedCenter = getReorderRectCenter(draggedRect, session.axis) + clampedOffset;
    const nextTargetIndex = getReorderTargetIndex({
      rects: session.rects,
      fromIndex: session.fromIndex,
      draggedCenter,
      axis: session.axis,
    });

    if (nextTargetIndex !== session.targetIndex) {
      session.targetIndex = nextTargetIndex;
      session.itemEls.forEach((itemEl, index) => {
        const offset = getReorderSiblingOffset({
          index,
          fromIndex: session.fromIndex,
          targetIndex: session.targetIndex,
          slotStep: session.slotStep,
        });

        itemEl.style.transform =
          offset === 0
            ? ''
            : session.axis === 'y'
              ? `translate3d(0, ${offset}px, 0)`
              : `translate3d(${offset}px, 0, 0)`;
      });
    }

    session.autoScroll.update(session.lastClientX, session.lastClientY);
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
      press.longPressTimer = undefined;
    }

    const itemEls = [...containerEl.querySelectorAll(reorderItemSelector)].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const ids = itemEls.map((element) => element.getAttribute(REORDER_ITEM_ATTRIBUTE) ?? '');
    const fromIndex = itemEls.indexOf(press.itemEl);

    if (fromIndex < 0 || ids.some((id) => !id)) {
      abandonPending();
      return;
    }

    const rects = itemEls.map((element, index): ReorderItemRect => {
      const rect = element.getBoundingClientRect();

      return {
        id: ids[index] ?? '',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
    const axis = getReorderAxis(rects);
    const scrollEl =
      scrollContainerElRef.value instanceof HTMLElement ? scrollContainerElRef.value : containerEl;

    pending = undefined;
    active = {
      ...press,
      containerEl,
      scrollEl,
      itemEls,
      ids,
      rects,
      axis,
      slotStep: getReorderSlotStep(rects, fromIndex, axis),
      fromIndex,
      targetIndex: fromIndex,
      baseScrollLeft: scrollEl.scrollLeft,
      baseScrollTop: scrollEl.scrollTop,
      overlay: createReorderOverlay(press.itemEl),
      autoScroll: createReorderAutoScroll({
        scrollEl,
        axis,
        onScrollStep: applyMove,
      }),
    };

    press.itemEl.classList.add(REORDER_ITEM_SLOT_CLASS);
    containerEl.classList.add(REORDER_SURFACE_ACTIVE_CLASS);

    if (typeof press.itemEl.setPointerCapture === 'function') {
      try {
        press.itemEl.setPointerCapture(press.pointerId);
      } catch {
        // Pointer capture is an enhancement; the window listeners already track the session.
      }
    }

    callbacks.onStart?.({
      itemId: press.itemId,
      orderedIds: [...ids],
      fromIndex,
      input: press.input,
    });

    applyMove();
  };

  /**
   * Tears down the active session and reports its outcome.
   * @param commit - Whether the session should report the moved order.
   */
  const finish = (commit: boolean) => {
    if (!active) {
      return;
    }

    const session = active;

    active = undefined;
    removeWindowListeners();
    session.autoScroll.stop();
    session.overlay?.destroy();
    session.itemEls.forEach((itemEl) => {
      itemEl.style.transform = '';
    });
    session.itemEl.classList.remove(REORDER_ITEM_SLOT_CLASS);
    session.containerEl.classList.remove(REORDER_SURFACE_ACTIVE_CLASS);

    if (typeof session.itemEl.releasePointerCapture === 'function') {
      try {
        session.itemEl.releasePointerCapture(session.pointerId);
      } catch {
        // The capture may already be gone after pointerup/pointercancel.
      }
    }

    const toIndex = commit ? session.targetIndex : session.fromIndex;

    callbacks.onEnd?.({
      orderedIds: moveReorderListItem(session.ids, session.fromIndex, toIndex),
      fromIndex: session.fromIndex,
      toIndex,
    });
  };

  const onWindowPointerMove = (event: PointerEvent) => {
    if (active) {
      if (event.pointerId !== active.pointerId) {
        return;
      }

      active.lastClientX = event.clientX;
      active.lastClientY = event.clientY;
      applyMove();
      return;
    }

    if (!pending || event.pointerId !== pending.pointerId) {
      return;
    }

    pending.lastClientX = event.clientX;
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
        finish(true);
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
        callbacks.onCancel?.();
        finish(false);
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

    const input = getReorderInputFromPointerType(event.pointerType);

    pending = {
      pointerId: event.pointerId,
      itemEl,
      itemId,
      input,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      longPressTimer:
        input === 'touch' ? setTimeout(activate, REORDER_TOUCH_LONG_PRESS_MS) : undefined,
    };

    addWindowListeners();
  });

  // Reorder items must never enter native browser drag-and-drop: no browser drag image
  // and no native DnD session may compete with the geometry engine.
  useEventListener(containerElRef, 'dragstart', (event) => {
    const containerEl = getContainerEl();

    if (pending || active || (containerEl && findReorderItemForPress(event.target, containerEl))) {
      event.preventDefault();
    }
  });

  const cancel = () => {
    abandonPending();
    finish(false);
  };

  watch(
    () => toValue(disabled),
    (isDisabled) => {
      if (isDisabled) {
        cancel();
      }
    },
  );

  watch(containerElRef, (nextContainerEl) => {
    if (active && nextContainerEl !== active.containerEl) {
      cancel();
    }
  });

  onScopeDispose(() => {
    cancel();
  });

  return {
    /** Cancels the current press or active session, rolling the DOM back. */
    cancel,
  };
};
