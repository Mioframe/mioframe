import type { MaybeRef } from 'vue';
import { computed, watch, toValue } from 'vue';
import {
  createGlobalState,
  tryOnScopeDispose,
  unrefElement,
  type MaybeElementRef,
} from '@vueuse/core';
import { throttle } from 'es-toolkit';
import { useChildTeleportContainerStack } from './teleportContainer';

type EventTypes = keyof DocumentEventMap;

type InteractionOutsideOptions = {
  ignore?: MaybeRef<MaybeElementRef[]>;
  events?: EventTypes[]; // Типизация событий на основе WindowEventMap
  throttleWait?: number; // Опция для троттлинга
};

const useDocumentEventListeners = createGlobalState(() => {
  const state: {
    [K in keyof DocumentEventMap]?: ((ev: DocumentEventMap[K]) => unknown)[];
  } = {};

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- for window.addEventListener
  const documentAddEventListener = <K extends keyof DocumentEventMap>(
    type: K,
  ) => {
    document.addEventListener(
      type,
      (ev: DocumentEventMap[K]) => {
        state[type]?.toReversed().forEach((listener) => {
          listener(ev);
        });
      },
      { capture: true },
    );
  };

  const add = <K extends keyof DocumentEventMap>(
    type: K,
    listener: (ev: DocumentEventMap[K]) => unknown,
  ) => {
    if (!state[type]) {
      documentAddEventListener(type);
      state[type] = [];
    }
    state[type].push(listener);
  };

  const remove = <K extends keyof DocumentEventMap>(
    type: K,
    listener: (ev: DocumentEventMap[K]) => unknown,
  ) => {
    if (state[type]) {
      const index = state[type].indexOf(listener);
      if (index >= 0) {
        state[type].splice(index, 1);
      }
    }
  };

  return {
    add,
    remove,
  };
});

function defineType<T>(value: T): T {
  return value;
}

export const onInteractionOutside = (
  target: MaybeElementRef,
  callback: (event: Event) => unknown,
  options: InteractionOutsideOptions = {},
) => {
  const defaultEvents = defineType<EventTypes[]>([
    'click',
    'touchstart',
    'keydown',
    'visibilitychange',
    'wheel',
  ]);

  const {
    events = defaultEvents,
    throttleWait = 1e3 / 3,
    ignore = [],
  } = options;

  const { stack: childTeleportContainers } = useChildTeleportContainerStack();

  const handleInteraction = throttle((event: Event) => {
    const eventTarget = event.target instanceof Node ? event.target : undefined;
    if (!eventTarget) {
      return;
    }

    const ignoreList = toValue(ignore).map(unrefElement);

    const targetEl = unrefElement(target);

    const containers: (HTMLElement | SVGElement | null | undefined)[] = [
      targetEl,
      ...ignoreList,
      ...childTeleportContainers,
    ];

    const isInside = containers.some(
      (container) =>
        container &&
        (container == eventTarget || container.contains(eventTarget)),
    );

    if (!isInside) {
      callback(event);
    }
  }, throttleWait);

  const hasTarget = computed(() => !!unrefElement(target));

  const { add: documentAddEventListener, remove: documentRemoveEventListener } =
    useDocumentEventListeners();

  watch(
    hasTarget,
    (hasTarget) => {
      if (hasTarget) {
        events.forEach((event) => {
          documentAddEventListener(event, handleInteraction);
        });
      } else {
        events.forEach((event) => {
          documentRemoveEventListener(event, handleInteraction);
        });
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    events.forEach((event) => {
      documentRemoveEventListener(event, handleInteraction);
    });
  });
};
