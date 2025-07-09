import type { MaybeElementRef } from '@vueuse/core';
import {
  tryOnScopeDispose,
  unrefElement,
  useEventListener,
} from '@vueuse/core';
import { isUndefined, throttle } from 'es-toolkit';
import { computed } from 'vue';

export const useDragListener = (
  rawEl: MaybeElementRef,
  {
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragEnter,
  }: {
    onDragStart?: (e: { target: EventTarget | null }) => unknown;
    onDragOver?: (e: { target: EventTarget | null }) => unknown;
    onDragEnter?: (e: { target: EventTarget | null }) => unknown;
    onDragEnd?: () => unknown;
  },
) => {
  const targetEl = computed(() => unrefElement(rawEl));

  let dragStarted = false;

  /**
   * Native DnD response timeout.
   * @default 600 // it's a little longer than the response time in chromium on android
   *  */
  const nativeDragStartResponseTimeout = 600;

  let pseudoDragStartTimeoutId: ReturnType<typeof setTimeout> | undefined =
    undefined;

  let lastEnterEventTarget: EventTarget | null | undefined;

  const onPseudoDragStart = ({ target }: { target: EventTarget | null }) => {
    if (!isUndefined(navigator) && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    lastEnterEventTarget = undefined;
    dragStarted = true;
    onDragStart?.({ target });
  };

  useEventListener(targetEl, 'touchstart', (e) => {
    if (!dragStarted) {
      clearTimeout(pseudoDragStartTimeoutId);
      pseudoDragStartTimeoutId = setTimeout(() => {
        if (!dragStarted) {
          onPseudoDragStart(e);
        }
      }, nativeDragStartResponseTimeout);
    }
  });

  useEventListener(targetEl, 'dragstart', (e: DragEvent) => {
    clearTimeout(pseudoDragStartTimeoutId);
    const { target } = e;
    lastEnterEventTarget = undefined;
    dragStarted = true;
    onDragStart?.({ target });
  });

  let useOriginalDragOver = false;

  const onPseudoDragOver = throttle(
    (e: TouchEvent) => {
      if (onDragOver) {
        const {
          touches: [{ clientX, clientY }],
        } = e;

        const pseudoTarget = document.elementFromPoint(clientX, clientY);

        onDragOver({ target: pseudoTarget });
      }
    },
    1e3 / 120,
    { edges: ['leading'] },
  );

  const onPseudoDragEnter = (e: TouchEvent) => {
    if (onDragEnter) {
      const {
        touches: [{ clientX, clientY }],
      } = e;

      const pseudoTarget = document.elementFromPoint(clientX, clientY);

      if (lastEnterEventTarget !== pseudoTarget) {
        lastEnterEventTarget = pseudoTarget;

        onDragEnter({ target: pseudoTarget });
      }
    }
  };

  useEventListener(
    targetEl,
    'touchmove',
    (e: TouchEvent) => {
      if (!dragStarted) {
        clearTimeout(pseudoDragStartTimeoutId);
      } else if (!useOriginalDragOver) {
        e.preventDefault();
        onPseudoDragOver(e);
        onPseudoDragEnter(e);
      }
    },
    { passive: false },
  );

  useEventListener(targetEl, 'dragover', ({ target }) => {
    clearTimeout(pseudoDragStartTimeoutId);
    useOriginalDragOver = true;
    onDragOver?.({ target });
  });

  useEventListener(targetEl, 'dragenter', ({ target }) => {
    onDragEnter?.({ target });
  });

  useEventListener(targetEl, 'dragend', () => {
    if (dragStarted) {
      dragStarted = false;
      useOriginalDragOver = false;
      onDragEnd?.();
    }
  });

  const onPseudoDragEnd = () => {
    if (!useOriginalDragOver && dragStarted) {
      dragStarted = false;
      useOriginalDragOver = false;
      lastEnterEventTarget = undefined;
      onDragEnd?.();
    }
  };

  useEventListener(targetEl, 'touchend', () => {
    clearTimeout(pseudoDragStartTimeoutId);
    onPseudoDragEnd();
  });

  useEventListener(targetEl, 'touchcancel', () => {
    clearTimeout(pseudoDragStartTimeoutId);
    onPseudoDragEnd();
  });

  useEventListener(targetEl, 'drop', (e: DragEvent) => {
    e.preventDefault();
    if (dragStarted) {
      dragStarted = false;
      useOriginalDragOver = false;
      lastEnterEventTarget = undefined;
      onDragEnd?.();
    }
  });

  tryOnScopeDispose(() => {
    clearTimeout(pseudoDragStartTimeoutId);
  });
};
