import { unrefElement, useEventListener, type MaybeElementRef } from '@vueuse/core';
import { computed, nextTick, onScopeDispose, reactive, toValue, watch } from 'vue';
import './reorderSurface.css';
import { REORDER_SURFACE_ACTIVATING_CLASS } from './constants';
import { applyReorderFlipAnimation, clearReorderItemTransforms } from './reorderAnimation';
import {
  resolveReorderPostDragClick,
  shouldClearReorderPostDragSuppressionOnInput,
} from './reorderPostDragClick';
import { createReorderSession } from './reorderSession';
import {
  acquireReorderDocumentSelectionSuppression,
  beginReorderSurfacePendingPress,
  cleanupPostDragInteraction,
  cloneReorderItemIdList,
  completeReorderSurfaceDrag,
  createReorderSurfaceState,
  endReorderSurfacePendingPress,
  isReorderItemTarget,
  isMouseLikeEvent,
  isPointerEvent,
  isSameOrderedIds,
  isTouchLikeEvent,
  requestReorderSurfaceCancel,
  resetDragState,
  rollbackReorderSurfaceCommit,
  shouldIgnoreTarget,
  shouldUseBestEffortReorderHaptics,
  startReorderSurfaceDrag,
  syncReorderSurfaceExternalItemIdList,
} from './useReorderSurface.helpers';
import type { ReorderInput } from './reorderInput';
import type { UseReorderSurfaceOptions } from './reorderTypes';

/**
 * Public composable that wires the reactive reorder session to optimistic order state and
 * persistence.
 *
 * There is no lifted overlay and no DOM cloning: the sortable layer only updates
 * `displayItemIdList`, and Vue re-renders the list in the new order. Input behavior is
 * inferred internally — mouse presses activate after a small movement threshold with no
 * delay, touch/pen presses require a long press, and subtrees marked with
 * `v-reorder-ignore` never start a session.
 * @param container - Reorder-surface root element or component reference.
 * @param options - Reactive item order, commit handler, and optional disabled flag.
 * @returns Reorder session state and control methods for the owning surface.
 */
export const useReorderSurface = (
  container: MaybeElementRef,
  options: UseReorderSurfaceOptions,
) => {
  const containerEl = computed(() => unrefElement(container));
  const state = reactive(createReorderSurfaceState(toValue(options.itemIdList)));
  let activationSelectionRelease: (() => void) | undefined;
  let dragSelectionRelease: (() => void) | undefined;

  const getContainerElement = (): HTMLElement | undefined =>
    containerEl.value instanceof HTMLElement ? containerEl.value : undefined;

  const setContainerClass = (
    className: string,
    enabled: boolean,
    element = getContainerElement(),
  ) => {
    element?.classList.toggle(className, enabled);
  };

  const startActivationWindow = () => {
    if (state.phase !== 'idle') {
      return;
    }

    beginReorderSurfacePendingPress(state);
    setContainerClass(REORDER_SURFACE_ACTIVATING_CLASS, true);
    activationSelectionRelease = acquireReorderDocumentSelectionSuppression();
  };

  const endActivationWindow = () => {
    if (state.phase !== 'pendingPress') {
      return;
    }

    endReorderSurfacePendingPress(state);
    setContainerClass(REORDER_SURFACE_ACTIVATING_CLASS, false);
    activationSelectionRelease?.();
    activationSelectionRelease = undefined;
  };

  const startDragSelectionSuppression = () => {
    if (dragSelectionRelease) {
      return;
    }

    dragSelectionRelease = acquireReorderDocumentSelectionSuppression({
      suppressTouchMoveDefault: true,
    });
  };

  const endDragSelectionSuppression = () => {
    dragSelectionRelease?.();
    dragSelectionRelease = undefined;
  };

  /**
   * Applies touch-specific cleanup after a drag session completes or is cancelled.
   * @param input - Input source used by the session that just ended.
   */
  const cleanupAfterDrag = (input: ReorderInput) => {
    if (input === 'touch') {
      requestAnimationFrame(() => {
        cleanupPostDragInteraction(containerEl.value);
      });
    }
  };

  /** Clears stale post-drag click suppression when a new press starts. */
  const clearStalePostDragSuppression = () => {
    if (
      shouldClearReorderPostDragSuppressionOnInput({
        isDragging: state.phase === 'dragging',
        suppressNextClick: state.suppressNextClick,
      })
    ) {
      state.suppressNextClick = false;
    }
  };

  /**
   * Handles a new press on the surface: clears stale click suppression and opens the
   * activation-window selection suppression for presses on reorder items.
   * @param event - Pointer, touch, or mouse press observed on the reorder surface.
   */
  const onSurfacePress = (event: Event) => {
    clearStalePostDragSuppression();

    if (shouldIgnoreTarget(event.target)) {
      return;
    }

    if (isReorderItemTarget(event.target)) {
      startActivationWindow();
    }
  };

  /**
   * Cancels a pending or active session and drives `phase` back to `idle`.
   *
   * Rollback intent is requested before the underlying session tears down, so a session
   * cancelled this way is always discarded rather than reported as a commit.
   */
  const cancelActiveInteraction = () => {
    if (state.phase === 'idle' || state.phase === 'committing') {
      return;
    }

    const endInput = state.activeInput ?? 'pointer';

    requestReorderSurfaceCancel(state);
    session.cancel();
    endActivationWindow();
    endDragSelectionSuppression();
    // A real active session already reset these fields synchronously via its own
    // `onEnd`; resetting again here is idempotent and also covers a pending press,
    // which never reaches `onEnd`.
    resetDragState(state);
    state.phase = 'idle';
    cleanupAfterDrag(endInput);
  };

  const session = createReorderSession(container, {
    disabled: computed(() => Boolean(toValue(options.disabled))),
    callbacks: {
      getExpectedIds: () => state.displayItemIdList,
      onActivate: ({ itemId, orderedIds, fromIndex, input }) => {
        endActivationWindow();

        if (
          typeof navigator !== 'undefined' &&
          shouldUseBestEffortReorderHaptics(input) &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(10);
        }

        startReorderSurfaceDrag(state, { itemId, orderedIds, fromIndex, input });
        startDragSelectionSuppression();
      },
      onOrderChange: ({ orderedIds, previousRects }) => {
        state.displayItemIdList = orderedIds;

        const containerElement = getContainerElement();

        if (containerElement) {
          void nextTick(() => {
            applyReorderFlipAnimation(containerElement, previousRects);
          });
        }
      },
      onCancel: () => {
        endActivationWindow();
        endDragSelectionSuppression();
        requestReorderSurfaceCancel(state);
      },
      onEnd: async ({ orderedIds, fromIndex, toIndex }) => {
        endActivationWindow();
        endDragSelectionSuppression();
        const endInput = state.activeInput ?? 'pointer';
        const containerElement = getContainerElement();
        const dragResult = completeReorderSurfaceDrag(state, {
          orderedIds,
          fromIndex,
          toIndex,
          currentItemIdList: toValue(options.itemIdList),
        });

        if (containerElement) {
          clearReorderItemTransforms(containerElement);
        }

        if (dragResult.type === 'commit') {
          state.phase = 'committing';

          try {
            await options.onCommit(dragResult.payload);
          } catch {
            rollbackReorderSurfaceCommit(state, dragResult.commitId);
          } finally {
            state.phase = 'idle';
          }
        }

        cleanupAfterDrag(endInput);
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

      onSurfacePress(event);
    },
    { capture: true, passive: false },
  );

  useEventListener(
    containerEl,
    'touchstart',
    (event) => {
      if (!isTouchLikeEvent(event)) {
        return;
      }

      onSurfacePress(event);
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

      onSurfacePress(event);
    },
    { capture: true, passive: false },
  );

  useEventListener(document, 'pointerup', endActivationWindow, { capture: true });
  useEventListener(document, 'pointercancel', endActivationWindow, { capture: true });
  useEventListener(document, 'mouseup', endActivationWindow, { capture: true });
  useEventListener(document, 'touchend', endActivationWindow, { capture: true });
  useEventListener(document, 'touchcancel', endActivationWindow, { capture: true });

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
    if (event.key !== 'Escape') {
      return;
    }

    cancelActiveInteraction();
  });

  useEventListener(window, 'blur', () => {
    cancelActiveInteraction();
  });

  watch(
    () => toValue(options.disabled),
    (isDisabled) => {
      if (isDisabled) {
        cancelActiveInteraction();
      }
    },
  );

  watch(
    () => toValue(options.itemIdList),
    (nextItemIdList) => {
      const normalized = cloneReorderItemIdList(nextItemIdList);

      // A reactive source (e.g. an Automerge-backed entity) can re-emit an id list that
      // is content-identical to what the surface already knows, just as a new array
      // reference. That carries no new information and must not cancel a pending or
      // active session — only a genuine order/content change does.
      if (isSameOrderedIds(state.latestExternalItemIdList, normalized)) {
        return;
      }

      cancelActiveInteraction();
      syncReorderSurfaceExternalItemIdList(state, nextItemIdList);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    cancelActiveInteraction();
  });

  return {
    displayItemIdList: computed(() => state.displayItemIdList),
    draggedId: computed(() => state.draggedId),
    isDragging: computed(() => state.phase === 'dragging'),
    cancel: cancelActiveInteraction,
  };
};
