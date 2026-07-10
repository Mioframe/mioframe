import {
  REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';
import type { ReorderInput } from './reorderInput';
import type { ReorderCommitPayload } from './reorderTypes';

/**
 * Explicit reorder session state machine.
 *
 * `idle` — no press and no pending commit. `pendingPress` — a press is armed but has not
 * cleared its activation gate. `dragging` — an active reorder session is updating
 * `displayItemIdList`. `committing` — the session ended with a changed order and
 * `onCommit` has not settled yet.
 */
export type ReorderPhase = 'idle' | 'pendingPress' | 'dragging' | 'committing';

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
  /** Input source locked for the active drag session. */
  activeInput: ReorderInput | undefined;
  /** Optimistic order currently waiting for external confirmation. */
  optimisticOrderedIds: string[] | undefined;
  /** External baseline order used to detect temporary re-emission of stale data. */
  optimisticBaseOrderedIds: string[] | undefined;
  /** Unique marker that ties rollback to the in-flight commit that created it. */
  optimisticCommitMarker: symbol | undefined;
  /** Current session phase. */
  phase: ReorderPhase;
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
  /** Input source resolved for the session. */
  input: ReorderInput;
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
 * Resets the transient drag session fields once a session ends. Does not touch `phase`:
 * callers decide the next phase (`idle` for a no-op end, `committing` for a pending
 * commit) since only they know the outcome of the session.
 * @param state - Shared reorder-session state to reset.
 */
export const resetDragState = (state: ReorderSurfaceState) => {
  state.draggedId = undefined;
  state.activeInput = undefined;
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
    activeInput: undefined,
    optimisticOrderedIds: undefined,
    optimisticBaseOrderedIds: undefined,
    optimisticCommitMarker: undefined,
    phase: 'idle',
    suppressNextClick: false,
    shouldRollbackOnEnd: false,
  };
};

/**
 * Arms the pending-press phase from idle. No-op when a session is already pending, active,
 * or committing.
 * @param state - Shared reorder-session state to update.
 */
export const beginReorderSurfacePendingPress = (state: ReorderSurfaceState) => {
  if (state.phase === 'idle') {
    state.phase = 'pendingPress';
  }
};

/**
 * Returns a pending press to idle without it ever activating. No-op once the session has
 * activated into `dragging`.
 * @param state - Shared reorder-session state to update.
 */
export const endReorderSurfacePendingPress = (state: ReorderSurfaceState) => {
  if (state.phase === 'pendingPress') {
    state.phase = 'idle';
  }
};

/**
 * Reconciles a fresh external order with the current session phase.
 *
 * Callers must cancel an active `pendingPress`/`dragging` session (and drive `phase` back
 * to `idle`) before calling this for that transition; this function only decides how the
 * external order applies once `phase` is `idle` or `committing`. While `committing`, the
 * optimistic order is authoritative until the in-flight commit settles — a genuinely
 * different external order observed mid-commit is recorded but not merged in, per the
 * external-update policy.
 * @param state - Shared reorder-session state to update.
 * @param rawItemIdList - Latest authoritative ordered ids received from the caller.
 */
export const syncReorderSurfaceExternalItemIdList = (
  state: ReorderSurfaceState,
  rawItemIdList: readonly string[] | undefined,
) => {
  const nextItemIdList = cloneReorderItemIdList(rawItemIdList);

  state.latestExternalItemIdList = nextItemIdList;

  if (state.phase === 'committing') {
    if (
      state.optimisticOrderedIds &&
      isSameOrderedIds(nextItemIdList, state.optimisticOrderedIds)
    ) {
      clearOptimisticState(state);
      state.displayItemIdList = nextItemIdList;
      return;
    }

    if (
      state.optimisticBaseOrderedIds &&
      isSameOrderedIds(nextItemIdList, state.optimisticBaseOrderedIds)
    ) {
      // Stale echo of the pre-commit order; keep waiting for the real confirmation.
      return;
    }

    // A genuinely different external order arrived mid-commit: do not merge it into the
    // active optimistic order. `latestExternalItemIdList` above already recorded it, so
    // it takes effect once the commit settles.
    return;
  }

  state.displayItemIdList = nextItemIdList;
};

/**
 * Marks the active drag session for rollback and click suppression.
 * @param state - Shared reorder-session state to update.
 */
export const requestReorderSurfaceCancel = (state: ReorderSurfaceState) => {
  if (state.phase !== 'dragging') {
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
  { itemId, orderedIds, fromIndex, input }: StartReorderSurfaceDragOptions,
) => {
  state.draggedId = itemId;
  state.activeInput = input;
  state.dragStartOrder = cloneReorderItemIdList(orderedIds);
  state.displayItemIdList = cloneReorderItemIdList(orderedIds);
  state.phase = 'dragging';
  state.suppressNextClick = false;
  state.shouldRollbackOnEnd = fromIndex < 0;
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
  const currentInput = state.activeInput;
  const rollbackOrder = cloneReorderItemIdList(state.dragStartOrder);
  const latestExternalOrder = cloneReorderItemIdList(state.latestExternalItemIdList);
  const nextOrderedIds = cloneReorderItemIdList(orderedIds);
  const rollbackRequested = state.shouldRollbackOnEnd;

  state.suppressNextClick = true;
  resetDragState(state);
  state.phase = 'idle';

  if (!currentDraggedId || !currentInput) {
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
      input: currentInput,
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

let pendingReorderSelectionCleanupHandle: number | undefined;

/**
 * Schedules a single bounded fallback pass that re-clears selection one frame after a
 * suppressed move event. Some browsers (observed on Mobile Chrome) can still commit a
 * native selection anchor as part of a later default-action step even after a capturing
 * move listener already called `preventDefault()` and cleared the selection synchronously.
 * This is a safety net for that gap, not a substitute for the synchronous clear: it only
 * re-checks and clears if suppression is still active by the time the frame runs, and it
 * never re-schedules itself, so it cannot become a polling loop.
 */
const scheduleReorderSelectionCleanupFallback = () => {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return;
  }

  if (pendingReorderSelectionCleanupHandle !== undefined) {
    return;
  }

  pendingReorderSelectionCleanupHandle = window.requestAnimationFrame(() => {
    pendingReorderSelectionCleanupHandle = undefined;

    if (reorderSelectionSuppressionDepth > 0) {
      clearActiveDocumentSelection();
    }
  });
};

/**
 * Cancels a pending selection cleanup fallback frame, if one was scheduled.
 */
const cancelReorderSelectionCleanupFallback = () => {
  if (pendingReorderSelectionCleanupHandle === undefined) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(pendingReorderSelectionCleanupHandle);
  }

  pendingReorderSelectionCleanupHandle = undefined;
};

/**
 * Clears selection synchronously and schedules the bounded fallback pass for the same event.
 */
const clearActiveDocumentSelectionWithFallback = () => {
  clearActiveDocumentSelection();
  scheduleReorderSelectionCleanupFallback();
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
  clearActiveDocumentSelectionWithFallback();
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
    clearActiveDocumentSelectionWithFallback();
    return;
  }

  if (reorderActiveDragMoveSuppressionDepth > 0) {
    event.preventDefault();
  }

  clearActiveDocumentSelectionWithFallback();
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
    clearActiveDocumentSelectionWithFallback();
    return;
  }

  if (reorderSelectionSuppressionDepth > 0) {
    clearActiveDocumentSelectionWithFallback();
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
   * actual reorder drag is confirmed; activation-only callers must omit this so page
   * scrolling still works for presses that never turn into a drag.
   */
  suppressTouchMoveDefault?: boolean;
}

/**
 * Acquires document-level text-selection suppression for an active reorder interaction.
 *
 * Clears any selection already present in the document immediately, since native
 * selection can be created or extended in the window before this suppression takes
 * effect (e.g. between pointerdown activation and the engine reporting drag start).
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
      cancelReorderSelectionCleanupFallback();
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
 * Skips reorder activation inside explicit ignore zones.
 *
 * Reorder starts from anywhere on the row itself — including its primary action — so
 * only an explicit `data-sortable-ignore` subtree blocks activation. Rows mark their
 * trailing controls with `v-reorder-ignore` to keep them plainly clickable.
 * @param target - Event target to inspect.
 * @returns True when reorder activation should be skipped for this target.
 */
export const shouldIgnoreTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(`[${REORDER_IGNORE_ATTRIBUTE}]`) !== null;
