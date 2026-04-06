import {
  unrefElement,
  useEventListener,
  type MaybeElementRef,
} from '@vueuse/core';
import { computed, reactive, ref, toValue, watch } from 'vue';
import './reorderSurface.css';
import {
  defaultReorderInteractiveSelector,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
  REORDER_SURFACE_DRAGGING_CLASS,
} from './constants';
import {
  getDefaultReorderInput,
  getReorderInputFromPointerType,
  getReorderGestureProfile,
} from './reorderGestureProfile';
import {
  resolveReorderPostDragClick,
  shouldClearReorderPostDragSuppressionOnInput,
} from './reorderPostDragClick';
import { createSortableAdapter } from './sortableAdapter';
import type {
  ReorderCommitPayload,
  ReorderInput,
  ReorderInputProfile,
  UseReorderSurfaceOptions,
} from './reorderTypes';

/** Full local session state used to reconcile drag preview with external updates. */
interface ReorderSurfaceState {
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
interface StartReorderSurfaceDragOptions {
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
interface CompleteReorderSurfaceDragOptions {
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
type CompleteReorderSurfaceDragResult =
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

/** Clones the external item list into mutable local state. */
const cloneReorderItemIdList = (
  itemIdList: readonly string[] | undefined,
): string[] => (itemIdList ? [...itemIdList] : []);

/** Compares two ordered id lists without allocating intermediate structures. */
const isSameOrderedIds = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((id, index) => id === right[index]);

/** Checks whether two lists contain the same ids even if their order differs. */
const hasSameItemSet = (
  left: readonly string[],
  right: readonly string[],
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);

  return right.every((id) => leftSet.has(id));
};

/** Clears optimistic commit bookkeeping after confirmation, rollback, or cancel. */
const clearOptimisticState = (state: ReorderSurfaceState) => {
  state.optimisticOrderedIds = undefined;
  state.optimisticBaseOrderedIds = undefined;
  state.optimisticCommitMarker = undefined;
};

/** Resets the transient drag session fields once a session ends. */
const resetDragState = (state: ReorderSurfaceState) => {
  state.isDragging = false;
  state.draggedId = undefined;
  state.activeProfile = undefined;
  state.dragStartOrder = [];
  state.shouldRollbackOnEnd = false;
};

/** Creates the initial local reorder state from the authoritative external order. */
const createReorderSurfaceState = (
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

/** Reconciles a fresh external order with the current drag or optimistic session. */
const syncReorderSurfaceExternalItemIdList = (
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

/** Marks the active drag session for rollback and click suppression. */
const requestReorderSurfaceCancel = (state: ReorderSurfaceState) => {
  if (!state.isDragging) {
    return;
  }

  state.shouldRollbackOnEnd = true;
  state.suppressNextClick = true;
};

/** Captures drag-start state before the DOM begins to preview a new order. */
const startReorderSurfaceDrag = (
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

/** Updates local display order while SortableJS is previewing a drag move. */
const previewReorderSurfaceDrag = (
  state: ReorderSurfaceState,
  orderedIds: readonly string[],
) => {
  state.displayItemIdList = cloneReorderItemIdList(orderedIds);
};

/** Resolves whether drag end is a no-op, rollback, or a new commit request. */
const completeReorderSurfaceDrag = (
  state: ReorderSurfaceState,
  {
    orderedIds,
    fromIndex,
    toIndex,
    currentItemIdList,
  }: CompleteReorderSurfaceDragOptions,
): CompleteReorderSurfaceDragResult => {
  const currentDraggedId = state.draggedId;
  const currentProfile = state.activeProfile;
  const rollbackOrder = cloneReorderItemIdList(state.dragStartOrder);
  const latestExternalOrder = cloneReorderItemIdList(
    state.latestExternalItemIdList,
  );
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

/** Restores the latest external order when an optimistic commit is rejected. */
const rollbackReorderSurfaceCommit = (
  state: ReorderSurfaceState,
  commitId: symbol,
) => {
  if (state.optimisticCommitMarker !== commitId) {
    return;
  }

  clearOptimisticState(state);
  state.displayItemIdList = cloneReorderItemIdList(
    state.latestExternalItemIdList,
  );
};

/** Narrows an event to a pointer event carrying `pointerType`. */
const isPointerEvent = (
  event: Event,
): event is PointerEvent & { pointerType: string } =>
  'pointerType' in event && typeof event.pointerType === 'string';

/** Detects touchstart-like events used to switch the active input mode. */
const isTouchLikeEvent = (event: Event): event is TouchEvent =>
  event.type === 'touchstart' ||
  ('touches' in event && typeof event.touches === 'object');

/** Detects mouse-down events used to restore pointer mode on desktop. */
const isMouseLikeEvent = (event: Event): event is MouseEvent =>
  event.type === 'mousedown';

/** Enables haptic feedback by default for touch-like drag starts when supported. */
const shouldUseBestEffortReorderHaptics = (input: ReorderInput): boolean =>
  input === 'touch';

/** Clears selection and focus artifacts left behind by touch-like drag sessions. */
const cleanupPostDragInteraction = (
  containerEl: HTMLElement | SVGElement | null | undefined,
) => {
  if (typeof document === 'undefined') {
    return;
  }

  const selection = document.getSelection();

  if (selection && selection.rangeCount > 0) {
    selection.removeAllRanges();
  }

  const activeElement = document.activeElement;

  if (
    activeElement instanceof HTMLElement &&
    containerEl?.contains(activeElement) &&
    typeof activeElement.blur === 'function'
  ) {
    activeElement.blur();
  }
};

/** Skips drag activation on interactive descendants inside a reorder item. */
const shouldIgnoreTarget = (
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

/** Public composable that wires DOM input, SortableJS, and optimistic reorder state. */
export const useReorderSurface = (
  container: MaybeElementRef,
  options: UseReorderSurfaceOptions,
) => {
  const containerEl = computed(() => unrefElement(container));
  const lastInput = ref<ReorderInput>(getDefaultReorderInput());
  const layout = computed(() => toValue(options.layout) ?? 'vertical');
  const activation = computed(() => toValue(options.activation) ?? 'immediate');
  const density = computed(() => toValue(options.density) ?? 'comfortable');
  const interactiveSelector = computed(
    () =>
      toValue(options.interactiveSelector) ?? defaultReorderInteractiveSelector,
  );
  const profile = computed(() =>
    getReorderGestureProfile({
      input: lastInput.value,
      layout,
      activation,
      density,
    }),
  );

  const state = reactive(
    createReorderSurfaceState(toValue(options.itemIdList)),
  );
  const isReorderSession = computed(() => state.isDragging);

  /** Applies touch-specific cleanup after a drag session completes or is cancelled. */
  const cleanupAfterDrag = (input: ReorderInput) => {
    if (['touch', 'pen'].includes(input)) {
      requestAnimationFrame(() => {
        cleanupPostDragInteraction(containerEl.value);
      });
    }
  };

  /** Tracks the last meaningful input mode used on the reorder surface. */
  const syncPointerInput = (event: Event) => {
    if (
      shouldClearReorderPostDragSuppressionOnInput({
        isDragging: state.isDragging,
        suppressNextClick: state.suppressNextClick,
      })
    ) {
      state.suppressNextClick = false;
    }

    if (shouldIgnoreTarget(event.target, interactiveSelector.value)) {
      return;
    }

    if (isPointerEvent(event)) {
      lastInput.value = getReorderInputFromPointerType(event.pointerType);
      return;
    }

    if (isTouchLikeEvent(event)) {
      lastInput.value = 'touch';
      return;
    }

    lastInput.value = 'pointer';
  };

  watch(
    () => toValue(options.itemIdList),
    (nextItemIdList) => {
      syncReorderSurfaceExternalItemIdList(state, nextItemIdList);
    },
    {
      immediate: true,
    },
  );

  watch(
    [containerEl, () => state.isDragging],
    ([nextContainerEl, nextIsDragging], [prevContainerEl]) => {
      if (prevContainerEl instanceof HTMLElement) {
        prevContainerEl.classList.remove(REORDER_SURFACE_DRAGGING_CLASS);
      }

      if (nextContainerEl instanceof HTMLElement) {
        nextContainerEl.classList.toggle(
          REORDER_SURFACE_DRAGGING_CLASS,
          nextIsDragging,
        );
      }
    },
    {
      immediate: true,
    },
  );

  const engine = createSortableAdapter(container, {
    layout,
    disabled: computed(() => Boolean(toValue(options.disabled))),
    interactiveSelector,
    profile,
    scrollContainer: options.scrollContainer,
    callbacks: {
      onStart: ({ itemId, orderedIds, fromIndex }) => {
        if (!itemId) {
          requestReorderSurfaceCancel(state);
          return;
        }

        if (
          typeof navigator !== 'undefined' &&
          shouldUseBestEffortReorderHaptics(profile.value.input) &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(10);
        }

        startReorderSurfaceDrag(state, {
          itemId,
          orderedIds,
          fromIndex,
          profile: profile.value,
        });
      },
      onChange: ({ orderedIds }) => {
        previewReorderSurfaceDrag(state, orderedIds);
      },
      onEnd: async ({ orderedIds, fromIndex, toIndex }) => {
        const endProfile = state.activeProfile ?? profile.value;
        const dragResult = completeReorderSurfaceDrag(state, {
          orderedIds,
          fromIndex,
          toIndex,
          currentItemIdList: toValue(options.itemIdList),
        });

        if (dragResult.type === 'commit') {
          try {
            await options.onCommit(dragResult.payload);
          } catch {
            rollbackReorderSurfaceCommit(state, dragResult.commitId);
          }
        }

        cleanupAfterDrag(endProfile.input);
      },
    },
  });

  useEventListener(
    containerEl,
    'pointerdown',
    (event) => {
      if (!isPointerEvent(event)) {
        return;
      }

      syncPointerInput(event);
    },
    { capture: true, passive: true },
  );

  useEventListener(
    containerEl,
    'touchstart',
    (event) => {
      if (!isTouchLikeEvent(event)) {
        return;
      }

      syncPointerInput(event);
    },
    { capture: true, passive: true },
  );

  useEventListener(
    containerEl,
    'mousedown',
    (event) => {
      if (!isMouseLikeEvent(event)) {
        return;
      }

      syncPointerInput(event);
    },
    { capture: true, passive: true },
  );

  useEventListener(
    document,
    'click',
    (event) => {
      const isTargetInsideSurface =
        containerEl.value instanceof HTMLElement &&
        event.target instanceof Node &&
        containerEl.value.contains(event.target);
      const { clearSuppression, preventClick } = resolveReorderPostDragClick({
        suppressNextClick: state.suppressNextClick,
        isTargetInsideSurface,
      });

      if (clearSuppression) {
        state.suppressNextClick = false;
      }

      if (preventClick) {
        event.preventDefault();
        event.stopPropagation();
        if ('stopImmediatePropagation' in event) {
          event.stopImmediatePropagation();
        }

        cleanupPostDragInteraction(containerEl.value);
        requestAnimationFrame(() => {
          cleanupPostDragInteraction(containerEl.value);
        });
      }
    },
    { capture: true },
  );

  useEventListener(window, 'keydown', (event) => {
    if (
      event.key !== 'Escape' ||
      !state.isDragging ||
      profile.value.input !== 'pointer'
    ) {
      return;
    }

    requestReorderSurfaceCancel(state);
    engine.cancel();
  });

  return {
    displayItemIdList: computed(() => state.displayItemIdList),
    draggedId: computed(() => state.draggedId),
    isDragging: computed(() => state.isDragging),
    isReorderSession,
    activeProfile: computed(() => state.activeProfile ?? profile.value),
    suppressNextClick: computed(() => state.suppressNextClick),
    cancel: () => {
      const endProfile = state.activeProfile ?? profile.value;

      requestReorderSurfaceCancel(state);
      engine.cancel();
      cleanupAfterDrag(endProfile.input);
    },
  };
};
