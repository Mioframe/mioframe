import {
  REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';
import type { ReorderCommitPayload, ReorderInput, ReorderInputProfile } from './reorderTypes';

/** Full local session state used to reconcile drag preview with external updates. */
export interface ReorderSurfaceState {
  /** Local render order used for drag preview and optimistic UI. */
  displayItemIdList: string[];
  /** Latest authoritative order received from outside the composable. */
  latestExternalItemIdList: string[];
  /** Id of the item currently being dragged, if any. */
  draggedId: string | undefined;
  /** Ordered ids captured at drag start. */
  dragStartOrder: string[];
  /** Runtime input profile locked for the active drag session. */
  activeProfile: ReorderInputProfile | undefined;
  /** Optimistic order currently waiting for external confirmation. */
  optimisticOrderedIds: string[] | undefined;
  /** External baseline order used to detect temporary re-emission of stale data. */
  optimisticBaseOrderedIds: string[] | undefined;
  /** Unique marker that ties rollback to the in-flight commit that created it. */
  optimisticCommitMarker: symbol | undefined;
  /** Whether SortableJS is currently inside an active drag session. */
  isDragging: boolean;
  /** Whether the next synthetic click should be suppressed. */
  suppressNextClick: boolean;
  /** Whether drag end should rollback instead of committing. */
  shouldRollbackOnEnd: boolean;
}

/** Data required to initialize a new drag session. */
export interface StartReorderSurfaceDragOptions {
  /** Id of the item being dragged. */
  itemId: string;
  /** Ordered ids reported by the drag engine at drag start. */
  orderedIds: readonly string[];
  /** Source index reported by the drag engine. */
  fromIndex: number;
  /** Runtime input profile resolved for the session. */
  profile: ReorderInputProfile;
}

/** Data required to resolve the final outcome of a drag session. */
export interface CompleteReorderSurfaceDragOptions {
  /** Ordered ids reported by the drag engine on session end. */
  orderedIds: readonly string[];
  /** Source index reported on drag end. */
  fromIndex: number;
  /** Destination index reported on drag end. */
  toIndex: number;
  /** Latest external order available when the session completes. */
  currentItemIdList: readonly string[] | undefined;
}

/** Result of drag completion before persistence is delegated to the caller. */
export type CompleteReorderSurfaceDragResult =
  | {
      /** Indicates that drag end should not persist a new order. */
      type: 'noop';
    }
  | {
      /** Indicates that drag end produced a new order that should be committed. */
      type: 'commit';
      /** Unique token used to associate rollback with this commit only. */
      commitId: symbol;
      /** Commit payload passed through to the external persistence callback. */
      payload: ReorderCommitPayload;
    };

/**
 * Clones the external item list into mutable local state.
 * @param itemIdList - Authoritative ordered item ids from the caller.
 * @returns A mutable copy that can be used for local drag state.
 */
export const cloneReorderItemIdList = (itemIdList: readonly string[] | undefined): string[] =>
  itemIdList ? [...itemIdList] : [];

/**
 * Compares two ordered id lists without allocating intermediate structures.
 * @param left - First ordered id list to compare.
 * @param right - Second ordered id list to compare.
 * @returns True when both lists have the same length and item order.
 */
export const isSameOrderedIds = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((id, index) => id === right[index]);

/**
 * Checks whether two lists contain the same ids even if their order differs.
 * @param left - First ordered id list to compare.
 * @param right - Second ordered id list to compare.
 * @returns True when both lists contain the same set of ids.
 */
export const hasSameItemSet = (left: readonly string[], right: readonly string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);

  return right.every((id) => leftSet.has(id));
};

/**
 * Clears optimistic commit bookkeeping after confirmation, rollback, or cancel.
 * @param state - Shared reorder-session state to reset.
 */
export const clearOptimisticState = (state: ReorderSurfaceState) => {
  state.optimisticOrderedIds = undefined;
  state.optimisticBaseOrderedIds = undefined;
  state.optimisticCommitMarker = undefined;
};

/**
 * Resets the transient drag session fields once a session ends.
 * @param state - Shared reorder-session state to reset.
 */
export const resetDragState = (state: ReorderSurfaceState) => {
  state.isDragging = false;
  state.draggedId = undefined;
  state.activeProfile = undefined;
  state.dragStartOrder = [];
  state.shouldRollbackOnEnd = false;
};

/**
 * Creates the initial local reorder state from the authoritative external order.
 * @param itemIdList - Authoritative ordered item ids from the caller.
 * @returns Initialized local reorder state derived from the external order.
 */
export const createReorderSurfaceState = (
  itemIdList: readonly string[] | undefined,
): ReorderSurfaceState => {
  const initialItemIdList = cloneReorderItemIdList(itemIdList);

  return {
    displayItemIdList: initialItemIdList,
    latestExternalItemIdList: initialItemIdList,
    draggedId: undefined,
    dragStartOrder: [],
    activeProfile: undefined,
    optimisticOrderedIds: undefined,
    optimisticBaseOrderedIds: undefined,
    optimisticCommitMarker: undefined,
    isDragging: false,
    suppressNextClick: false,
    shouldRollbackOnEnd: false,
  };
};

/**
 * Reconciles a fresh external order with the current drag or optimistic session.
 * @param state - Shared reorder-session state to update.
 * @param rawItemIdList - Latest authoritative ordered ids received from the caller.
 */
export const syncReorderSurfaceExternalItemIdList = (
  state: ReorderSurfaceState,
  rawItemIdList: readonly string[] | undefined,
) => {
  const nextItemIdList = cloneReorderItemIdList(rawItemIdList);

  state.latestExternalItemIdList = nextItemIdList;

  if (state.isDragging) {
    if (!isSameOrderedIds(state.dragStartOrder, nextItemIdList)) {
      state.shouldRollbackOnEnd = true;
    }

    return;
  }

  if (state.optimisticOrderedIds) {
    if (isSameOrderedIds(nextItemIdList, state.optimisticOrderedIds)) {
      clearOptimisticState(state);
      state.displayItemIdList = nextItemIdList;
      return;
    }

    if (
      state.optimisticBaseOrderedIds &&
      isSameOrderedIds(nextItemIdList, state.optimisticBaseOrderedIds)
    ) {
      return;
    }

    clearOptimisticState(state);
  }

  state.displayItemIdList = nextItemIdList;
};

/**
 * Marks the active drag session for rollback and click suppression.
 * @param state - Shared reorder-session state to update.
 */
export const requestReorderSurfaceCancel = (state: ReorderSurfaceState) => {
  if (!state.isDragging) {
    return;
  }

  state.shouldRollbackOnEnd = true;
  state.suppressNextClick = true;
};

/**
 * Captures drag-start state before the DOM begins to preview a new order.
 * @param state - Shared reorder-session state to update.
 * @param root0 - Drag-start payload emitted by the reorder adapter.
 */
export const startReorderSurfaceDrag = (
  state: ReorderSurfaceState,
  { itemId, orderedIds, fromIndex, profile }: StartReorderSurfaceDragOptions,
) => {
  state.draggedId = itemId;
  state.activeProfile = profile;
  state.dragStartOrder = cloneReorderItemIdList(orderedIds);
  state.displayItemIdList = cloneReorderItemIdList(orderedIds);
  state.isDragging = true;
  state.suppressNextClick = false;
  state.shouldRollbackOnEnd = fromIndex < 0;
};

/**
 * Updates local display order while SortableJS is previewing a drag move.
 * @param state - Shared reorder-session state to update.
 * @param orderedIds - Intermediate ordered ids reported during drag preview.
 */
export const previewReorderSurfaceDrag = (
  state: ReorderSurfaceState,
  orderedIds: readonly string[],
) => {
  state.displayItemIdList = cloneReorderItemIdList(orderedIds);
};

/**
 * Resolves whether drag end is a no-op, rollback, or a new commit request.
 * @param state - Shared reorder-session state to finalize.
 * @param root0 - Drag-end payload emitted by the reorder adapter.
 * @returns The drag outcome that the caller should apply or ignore.
 */
export const completeReorderSurfaceDrag = (
  state: ReorderSurfaceState,
  { orderedIds, fromIndex, toIndex, currentItemIdList }: CompleteReorderSurfaceDragOptions,
): CompleteReorderSurfaceDragResult => {
  const currentDraggedId = state.draggedId;
  const currentProfile = state.activeProfile;
  const rollbackOrder = cloneReorderItemIdList(state.dragStartOrder);
  const latestExternalOrder = cloneReorderItemIdList(state.latestExternalItemIdList);
  const nextOrderedIds = cloneReorderItemIdList(orderedIds);
  const rollbackRequested = state.shouldRollbackOnEnd;

  state.suppressNextClick = currentProfile?.suppressClickAfterDrag ?? true;
  resetDragState(state);

  if (!currentDraggedId || !currentProfile) {
    state.displayItemIdList = cloneReorderItemIdList(currentItemIdList);
    return {
      type: 'noop',
    };
  }

  if (rollbackRequested) {
    clearOptimisticState(state);
    state.displayItemIdList = latestExternalOrder;
    return {
      type: 'noop',
    };
  }

  if (!hasSameItemSet(rollbackOrder, nextOrderedIds)) {
    state.displayItemIdList = latestExternalOrder;
    return {
      type: 'noop',
    };
  }

  state.displayItemIdList = nextOrderedIds;

  if (isSameOrderedIds(rollbackOrder, nextOrderedIds)) {
    return {
      type: 'noop',
    };
  }

  state.optimisticOrderedIds = nextOrderedIds;
  state.optimisticBaseOrderedIds = rollbackOrder;

  const commitId = Symbol('reorder-commit');

  state.optimisticCommitMarker = commitId;

  return {
    type: 'commit',
    commitId,
    payload: {
      orderedIds: nextOrderedIds,
      movedId: currentDraggedId,
      fromIndex,
      toIndex,
      profile: currentProfile,
    },
  };
};

/**
 * Restores the latest external order when an optimistic commit is rejected.
 * @param state - Shared reorder-session state to roll back.
 * @param commitId - Commit token associated with the rejected optimistic reorder.
 */
export const rollbackReorderSurfaceCommit = (state: ReorderSurfaceState, commitId: symbol) => {
  if (state.optimisticCommitMarker !== commitId) {
    return;
  }

  clearOptimisticState(state);
  state.displayItemIdList = cloneReorderItemIdList(state.latestExternalItemIdList);
};

/**
 * Narrows an event to a pointer event carrying `pointerType`.
 * @param event - Event to narrow.
 * @returns True when the event exposes a string `pointerType`.
 */
export const isPointerEvent = (event: Event): event is PointerEvent & { pointerType: string } =>
  'pointerType' in event && typeof event.pointerType === 'string';

/**
 * Detects touchstart-like events used to switch the active input mode.
 * @param event - Event to inspect.
 * @returns True when the event should be treated as touch input.
 */
export const isTouchLikeEvent = (event: Event): event is TouchEvent =>
  event.type === 'touchstart' || ('touches' in event && typeof event.touches === 'object');

/**
 * Detects mouse-down events used to restore pointer mode on desktop.
 * @param event - Event to inspect.
 * @returns True when the event should be treated as a mouse press.
 */
export const isMouseLikeEvent = (event: Event): event is MouseEvent => event.type === 'mousedown';

/**
 * Enables haptic feedback by default for touch-like drag starts when supported.
 * @param input - Normalized reorder input mode for the current interaction.
 * @returns True when touch-like input should request best-effort haptics.
 */
export const shouldUseBestEffortReorderHaptics = (input: ReorderInput): boolean =>
  input === 'touch';

let reorderSelectionSuppressionDepth = 0;
let reorderActiveDragMoveSuppressionDepth = 0;

/** Listener options shared by suppression listeners that must call `preventDefault`. */
const suppressionListenerOptions: AddEventListenerOptions = {
  capture: true,
  passive: false,
};

const preventReorderSelectionStart = (event: Event) => {
  if (reorderSelectionSuppressionDepth > 0) {
    event.preventDefault();
  }
};

/**
 * Removes any active document selection ranges, if the Selection API is available.
 */
const clearActiveDocumentSelection = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const selection = document.getSelection();

  if (selection && selection.rangeCount > 0) {
    selection.removeAllRanges();
  }
};

/**
 * Clears any document selection created while reorder suppression is still acquired.
 * Native `selectionchange` can fire even when `selectstart` was prevented (e.g. selection
 * extension via keyboard, find-in-page, or platform-specific touch handling), so suppression
 * must keep clearing selection for its whole acquired lifetime, not only at acquire time.
 */
const clearSelectionWhileSuppressed = () => {
  if (reorderSelectionSuppressionDepth > 0) {
    clearActiveDocumentSelection();
  }
};

/**
 * Blocks the browser's default selection-extension action on mouse movement for the whole
 * suppression lifetime. Reactively clearing the selection after the fact is not reliable: the
 * browser can (re)create or extend a selection as its own default action, run after a
 * capturing listener already ran for that same move event, leaving a visible selection in the
 * gap. Mouse movement never drives page scrolling, so cancelling its default action is safe
 * for both activation and active-drag suppression.
 * @param event - Mouse move event dispatched while suppression may be active.
 */
const preventReorderMouseMove = (event: Event) => {
  if (reorderSelectionSuppressionDepth === 0) {
    return;
  }

  event.preventDefault();
  clearActiveDocumentSelection();
};

/**
 * Blocks the browser's default selection-extension action on pointermove, scoped by the
 * originating pointer type. Mouse pointer input never drives page scrolling, so its default
 * action can be cancelled for the whole suppression lifetime like {@link preventReorderMouseMove}.
 * Touch and pen pointer input can drive page scrolling, so their default action must stay
 * intact during activation-only suppression (a press that never becomes a drag must not block
 * normal scrolling) and may only be cancelled once active-drag suppression is acquired. An
 * event with an unrecognized `pointerType` is treated the same as touch/pen, since blocking
 * scrolling by default is the unsafe direction. Selection is cleared regardless of whether
 * the default action was prevented, since selection can still be created by other paths.
 * @param event - Pointer move event dispatched while suppression may be active.
 */
const preventReorderPointerLikeMove = (event: Event) => {
  if (reorderSelectionSuppressionDepth === 0) {
    return;
  }

  const pointerType = isPointerEvent(event) ? event.pointerType : undefined;

  if (pointerType === 'mouse') {
    event.preventDefault();
    clearActiveDocumentSelection();
    return;
  }

  if (reorderActiveDragMoveSuppressionDepth > 0) {
    event.preventDefault();
  }

  clearActiveDocumentSelection();
};

/**
 * Blocks the browser's default selection-extension action on touchmove, but only once an
 * actual reorder drag is confirmed. Activation-only suppression (before a drag is confirmed)
 * must leave touchmove's default action alone so a press that never turns into a drag keeps
 * normal page scrolling.
 * @param event - Touch move event dispatched while suppression may be active.
 */
const preventReorderTouchMove = (event: Event) => {
  if (reorderActiveDragMoveSuppressionDepth > 0) {
    event.preventDefault();
    clearActiveDocumentSelection();
    return;
  }

  if (reorderSelectionSuppressionDepth > 0) {
    clearActiveDocumentSelection();
  }
};

/**
 * Checks whether the event target belongs to a draggable reorder item.
 * @param target - Event target to inspect.
 * @returns True when the target is inside a draggable reorder item.
 */
export const isReorderItemTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(`[${REORDER_ITEM_ATTRIBUTE}]`) !== null;

/** Options accepted by {@link acquireReorderDocumentSelectionSuppression}. */
export interface ReorderDocumentSelectionSuppressionOptions {
  /**
   * Also blocks touchmove's default action for the lifetime of this token. Only safe once an
   * actual reorder drag is confirmed (SortableJS itself starts preventing default on move at
   * that point too); activation-only callers must omit this so page scrolling still works for
   * presses that never turn into a drag.
   */
  suppressTouchMoveDefault?: boolean;
}

/**
 * Acquires document-level text-selection suppression for an active reorder interaction.
 *
 * Clears any selection already present in the document immediately, since native
 * selection can be created or extended in the window before this suppression takes
 * effect (e.g. between pointerdown activation and SortableJS reporting drag start).
 * @param options - Suppression tuning for this acquisition.
 * @returns Idempotent release function for the acquired suppression token.
 */
export const acquireReorderDocumentSelectionSuppression = ({
  suppressTouchMoveDefault = false,
}: ReorderDocumentSelectionSuppressionOptions = {}): (() => void) => {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const rootEl = document.documentElement;

  if (!(rootEl instanceof HTMLElement)) {
    return () => {};
  }

  clearActiveDocumentSelection();

  reorderSelectionSuppressionDepth += 1;
  if (reorderSelectionSuppressionDepth === 1) {
    rootEl.classList.add(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS);
    document.addEventListener(
      'selectstart',
      preventReorderSelectionStart,
      suppressionListenerOptions,
    );
    document.addEventListener('selectionchange', clearSelectionWhileSuppressed);
    document.addEventListener('mousemove', preventReorderMouseMove, suppressionListenerOptions);
    document.addEventListener(
      'pointermove',
      preventReorderPointerLikeMove,
      suppressionListenerOptions,
    );
    document.addEventListener('touchmove', preventReorderTouchMove, suppressionListenerOptions);
  }

  const acquiredActiveDragMoveSuppression = suppressTouchMoveDefault;

  if (acquiredActiveDragMoveSuppression) {
    reorderActiveDragMoveSuppressionDepth += 1;
  }

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;
    reorderSelectionSuppressionDepth = Math.max(0, reorderSelectionSuppressionDepth - 1);

    if (acquiredActiveDragMoveSuppression) {
      reorderActiveDragMoveSuppressionDepth = Math.max(
        0,
        reorderActiveDragMoveSuppressionDepth - 1,
      );
    }

    if (reorderSelectionSuppressionDepth === 0) {
      rootEl.classList.remove(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS);
      document.removeEventListener(
        'selectstart',
        preventReorderSelectionStart,
        suppressionListenerOptions,
      );
      document.removeEventListener('selectionchange', clearSelectionWhileSuppressed);
      document.removeEventListener(
        'mousemove',
        preventReorderMouseMove,
        suppressionListenerOptions,
      );
      document.removeEventListener(
        'pointermove',
        preventReorderPointerLikeMove,
        suppressionListenerOptions,
      );
      document.removeEventListener(
        'touchmove',
        preventReorderTouchMove,
        suppressionListenerOptions,
      );
    }
  };
};

/**
 * Clears selection and focus artifacts left behind by touch-like drag sessions.
 * @param containerEl - Active reorder-surface container, used to limit focus cleanup.
 */
export const cleanupPostDragInteraction = (
  containerEl: HTMLElement | SVGElement | null | undefined,
) => {
  if (typeof document === 'undefined') {
    return;
  }

  clearActiveDocumentSelection();

  const activeElement = document.activeElement;

  if (
    activeElement instanceof HTMLElement &&
    containerEl?.contains(activeElement) &&
    typeof activeElement.blur === 'function'
  ) {
    activeElement.blur();
  }
};

/**
 * Skips drag activation on interactive descendants inside a reorder item.
 * @param target - Event target to inspect.
 * @param interactiveSelector - Selector list describing descendants that must stay interactive.
 * @returns True when drag activation should be skipped for this target.
 */
export const shouldIgnoreTarget = (
  target: EventTarget | null,
  interactiveSelector: string,
): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  const reorderItem = target.closest(`[${REORDER_ITEM_ATTRIBUTE}]`);
  const interactiveTarget = target.closest(interactiveSelector);

  return (
    (interactiveTarget !== null && interactiveTarget !== reorderItem) ||
    target.closest(`[${REORDER_IGNORE_ATTRIBUTE}]`) !== null
  );
};
