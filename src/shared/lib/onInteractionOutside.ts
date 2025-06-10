import type { MaybeRef } from 'vue';
import { computed, watch, toValue } from 'vue';
import {
  tryOnScopeDispose,
  unrefElement,
  type MaybeElementRef,
} from '@vueuse/core';
import { throttleDeprecated } from './throttle';

type EventTypes = keyof WindowEventMap;

type InteractionOutsideOptions = {
  ignore?: MaybeRef<MaybeElementRef[]>;
  events?: EventTypes[]; // Типизация событий на основе WindowEventMap
  throttleWait?: number; // Опция для троттлинга
};

export const onInteractionOutside = (
  target: MaybeElementRef,
  callback: () => void,
  options: InteractionOutsideOptions = {},
) => {
  const {
    events = ['click', 'touchstart', 'keydown', 'visibilitychange', 'wheel'],
    throttleWait = 1e3 / 3,
    ignore = [],
  } = options;

  const handleInteraction = throttleDeprecated((event: Event) => {
    const eventTarget = event.target instanceof Node ? event.target : undefined;
    if (!eventTarget) {
      return;
    }

    const ignoreList = toValue(ignore).map(unrefElement);

    const targetEl = unrefElement(target);

    const containers = [targetEl, ...ignoreList];

    const isInside = containers.some(
      (container) =>
        container == eventTarget || container?.contains(eventTarget),
    );

    if (!isInside) {
      callback();
    }
  }, throttleWait);

  const hasTarget = computed(() => !!unrefElement(target));

  watch(
    hasTarget,
    (hasTarget) => {
      if (hasTarget) {
        events.forEach((event) => {
          window.addEventListener(event, handleInteraction, true);
        });
      } else {
        events.forEach((event) => {
          window.removeEventListener(event, handleInteraction, true);
        });
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    events.forEach((event) => {
      window.removeEventListener(event, handleInteraction, true);
    });
  });
};
