import {
  unrefElement,
  useEventListener,
  type MaybeElementRef,
} from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import parseDuration from 'parse-duration';

let lastTarget: Element | null | undefined = undefined;

export const usePressed = (rawEl: MaybeElementRef) => {
  const target = computed(() => unrefElement(rawEl));

  const pressed = ref(false);

  useEventListener(
    target,
    ['mousedown', 'dragstart', 'touchstart'],
    ({ currentTarget }: MouseEvent | DragEvent | TouchEvent) => {
      if (
        currentTarget instanceof Element &&
        currentTarget === unrefElement(target) &&
        (!lastTarget || !currentTarget.contains(lastTarget))
      ) {
        lastTarget = currentTarget;
        pressed.value = true;
      }
    },
    { passive: true },
  );

  useEventListener(
    window,
    ['mouseleave', 'mouseup', 'drop', 'dragend', 'touchend', 'touchcancel'],
    () => {
      lastTarget = undefined;
      pressed.value = false;
    },
  );

  const durationPressedState = ref(false);

  let pressedTimeout: ReturnType<typeof setTimeout> | undefined;

  const getTransitionDuration = () => {
    const defaultDuration = 200;
    const el = unrefElement(target);

    if (el instanceof Element) {
      return (
        parseDuration(
          getComputedStyle(el).getPropertyValue('transition-duration'),
        ) ?? defaultDuration
      );
    }

    return defaultDuration;
  };

  watch(
    pressed,
    (v) => {
      if (v) {
        durationPressedState.value = v;

        clearTimeout(pressedTimeout);
        pressedTimeout = setTimeout(() => {
          durationPressedState.value = pressed.value;
          pressedTimeout = undefined;
        }, getTransitionDuration());
      } else if (pressedTimeout === undefined) {
        durationPressedState.value = pressed.value;
      }
    },
    { immediate: true },
  );

  return {
    pressed,
    durationPressedState,
  };
};
