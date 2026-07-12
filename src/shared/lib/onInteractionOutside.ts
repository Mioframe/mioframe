import type { MaybeRef } from 'vue';
import { computed, watch, toValue } from 'vue';
import {
  createGlobalState,
  tryOnScopeDispose,
  unrefElement,
  type MaybeElementRef,
} from '@vueuse/core';
import { useChildTeleportContainerStack } from './teleportContainer';

type EventTypes = keyof DocumentEventMap;

type InteractionOutsideOptions = {
  ignore?: MaybeRef<MaybeElementRef[]>;
  events?: EventTypes[]; // Типизация событий на основе WindowEventMap
};

const useDocumentEventListeners = createGlobalState(() => {
  const state: {
    [K in keyof DocumentEventMap]?: ((ev: DocumentEventMap[K]) => unknown)[];
  } = {};

  const documentAddEventListener = <K extends keyof DocumentEventMap>(type: K) => {
    document.addEventListener(
      type,
      (ev: DocumentEventMap[K]) => {
        state[type]?.toReversed().forEach((listener) => {
          listener(ev);
        });
      },
      { capture: true, passive: true },
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

/**
 * Synchronously classifies document-level interaction events (click,
 * touchstart, keydown, visibilitychange, wheel by default) as inside or
 * outside `target`, invoking `callback` for each confirmed outside event.
 * Teleported descendants registered through {@link useChildTeleportContainerStack}
 * and elements in `options.ignore` are treated as inside.
 * @param target - Overlay boundary element/ref; interactions inside it are ignored.
 * @param callback - Invoked synchronously with the triggering event for each outside interaction.
 * @param options - Optional ignore list and event type overrides.
 */
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

  const { events = defaultEvents, ignore = [] } = options;

  const { childStack: childTeleportContainers } = useChildTeleportContainerStack();

  const handleInteraction = (event: Event) => {
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
      (container) => container && (container == eventTarget || container.contains(eventTarget)),
    );

    if (!isInside) {
      callback(event);
    }
  };

  const hasTarget = computed(() => !!unrefElement(target));

  const { add: documentAddEventListener, remove: documentRemoveEventListener } =
    useDocumentEventListeners();

  watch(
    hasTarget,
    (hasResolvedTarget) => {
      if (hasResolvedTarget) {
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
