import { unrefElement, useEventListener, type MaybeElementRef } from '@vueuse/core';
import { computed, reactive, ref, toValue, watch } from 'vue';
import './reorderSurface.css';
import { defaultReorderInteractiveSelector, REORDER_SURFACE_DRAGGING_CLASS } from './constants';
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
import {
  cleanupPostDragInteraction,
  completeReorderSurfaceDrag,
  createReorderSurfaceState,
  isMouseLikeEvent,
  isPointerEvent,
  isTouchLikeEvent,
  previewReorderSurfaceDrag,
  requestReorderSurfaceCancel,
  rollbackReorderSurfaceCommit,
  shouldIgnoreTarget,
  shouldUseBestEffortReorderHaptics,
  startReorderSurfaceDrag,
  syncReorderSurfaceExternalItemIdList,
} from './useReorderSurface.helpers';
import type { ReorderInput, UseReorderSurfaceOptions } from './reorderTypes';

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
    () => toValue(options.interactiveSelector) ?? defaultReorderInteractiveSelector,
  );
  const profile = computed(() =>
    getReorderGestureProfile({
      input: lastInput.value,
      layout,
      activation,
      density,
    }),
  );

  const state = reactive(createReorderSurfaceState(toValue(options.itemIdList)));
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
        nextContainerEl.classList.toggle(REORDER_SURFACE_DRAGGING_CLASS, nextIsDragging);
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
      onCancel: () => {
        requestReorderSurfaceCancel(state);
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
    if (event.key !== 'Escape' || !state.isDragging || profile.value.input !== 'pointer') {
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
