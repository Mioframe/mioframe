import { unrefElement, useEventListener, type MaybeElementRef } from '@vueuse/core';
import { computed, onScopeDispose, reactive, ref, toValue, watch } from 'vue';
import './reorderSurface.css';
import { REORDER_SURFACE_ACTIVATING_CLASS } from './constants';
import { createReorderEngine } from './reorderEngine';
import {
  resolveReorderPostDragClick,
  shouldClearReorderPostDragSuppressionOnInput,
} from './reorderPostDragClick';
import {
  acquireReorderDocumentSelectionSuppression,
  cleanupPostDragInteraction,
  completeReorderSurfaceDrag,
  createReorderSurfaceState,
  isReorderItemTarget,
  isMouseLikeEvent,
  isPointerEvent,
  isTouchLikeEvent,
  requestReorderSurfaceCancel,
  rollbackReorderSurfaceCommit,
  shouldIgnoreTarget,
  shouldUseBestEffortReorderHaptics,
  startReorderSurfaceDrag,
  syncReorderSurfaceExternalItemIdList,
} from './useReorderSurface.helpers';
import type { ReorderInput } from './reorderInput';
import type { UseReorderSurfaceOptions } from './reorderTypes';

/**
 * Public composable that wires the geometry-based reorder engine to optimistic order
 * state and persistence.
 *
 * Input behavior is inferred internally: mouse presses activate after a small movement
 * threshold with no delay, touch/pen presses require a long press, and subtrees marked
 * with `v-reorder-ignore` never start a session.
 * @param container - Reorder-surface root element or component reference.
 * @param options - Reactive item order, commit handler, and optional tuning.
 * @returns Reorder session state and control methods for the owning surface.
 */
export const useReorderSurface = (
  container: MaybeElementRef,
  options: UseReorderSurfaceOptions,
) => {
  const containerEl = computed(() => unrefElement(container));

  const state = reactive(createReorderSurfaceState(toValue(options.itemIdList)));
  const isActivatingDrag = ref(false);
  const isReorderSession = computed(() => state.isDragging);
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
    if (isActivatingDrag.value) {
      return;
    }

    isActivatingDrag.value = true;
    setContainerClass(REORDER_SURFACE_ACTIVATING_CLASS, true);
    activationSelectionRelease = acquireReorderDocumentSelectionSuppression();
  };

  const endActivationWindow = () => {
    if (!isActivatingDrag.value) {
      return;
    }

    isActivatingDrag.value = false;
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
        isDragging: state.isDragging,
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
    containerEl,
    (nextContainerEl, prevContainerEl) => {
      if (prevContainerEl instanceof HTMLElement) {
        prevContainerEl.classList.remove(REORDER_SURFACE_ACTIVATING_CLASS);
      }

      if (nextContainerEl instanceof HTMLElement) {
        nextContainerEl.classList.toggle(REORDER_SURFACE_ACTIVATING_CLASS, isActivatingDrag.value);
      }
    },
    {
      immediate: true,
      flush: 'sync',
    },
  );

  onScopeDispose(() => {
    endActivationWindow();
    endDragSelectionSuppression();
  });

  const engine = createReorderEngine(container, {
    disabled: computed(() => Boolean(toValue(options.disabled))),
    scrollContainer: options.scrollContainer,
    callbacks: {
      onStart: ({ itemId, orderedIds, fromIndex, input }) => {
        endActivationWindow();

        if (
          typeof navigator !== 'undefined' &&
          shouldUseBestEffortReorderHaptics(input) &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(10);
        }

        startReorderSurfaceDrag(state, {
          itemId,
          orderedIds,
          fromIndex,
          input,
        });
        startDragSelectionSuppression();
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

  const clearActivationWindow = () => {
    if (!state.isDragging) {
      endActivationWindow();
    }
  };

  useEventListener(document, 'pointerup', clearActivationWindow, { capture: true });
  useEventListener(document, 'pointercancel', clearActivationWindow, { capture: true });
  useEventListener(document, 'mouseup', clearActivationWindow, { capture: true });
  useEventListener(document, 'touchend', clearActivationWindow, { capture: true });
  useEventListener(document, 'touchcancel', clearActivationWindow, { capture: true });

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
    if (event.key !== 'Escape' || !state.isDragging) {
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
    activeInput: computed(() => state.activeInput),
    suppressNextClick: computed(() => state.suppressNextClick),
    cancel: () => {
      const endInput = state.activeInput ?? 'pointer';

      requestReorderSurfaceCancel(state);
      engine.cancel();
      cleanupAfterDrag(endInput);
    },
  };
};
