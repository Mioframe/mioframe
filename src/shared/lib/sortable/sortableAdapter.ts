import { unrefElement, type MaybeElementRef } from '@vueuse/core';
import Sortable from 'sortablejs';
import {
  computed,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';
import {
  defaultReorderInteractiveSelector,
  getReorderDescendantInteractiveSelector,
  reorderClassNames,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';
import type {
  ReorderEngineCallbacks,
  ReorderInputProfile,
  ReorderLayout,
} from './reorderTypes';

/** Accesses the internal SortableJS drop hook used for cancel flows. */
interface SortableInternal extends Sortable {
  /** Internal SortableJS drop handler used to finish or cancel fallback sessions. */
  _onDrop?: (event?: Event) => void;
}

const reorderItemSelector = `[${REORDER_ITEM_ATTRIBUTE}]`;

/** Reads the stable item id assigned through `data-sortable-id`. */
const readItemId = (item: HTMLElement | null): string | undefined => {
  const rawItemId = item?.getAttribute(REORDER_ITEM_ATTRIBUTE);

  return rawItemId ?? undefined;
};

/** Returns the current DOM order as seen by SortableJS. */
const readOrderedIds = (sortable: Sortable | undefined): string[] =>
  sortable ? sortable.toArray().filter(Boolean) : [];

/** Invokes SortableJS internal drop handling to cancel or finish a session early. */
const runDrop = (sortable: SortableInternal | undefined, event?: Event) => {
  sortable?._onDrop?.(event);
};

/** Resolves the actual auto-scroll target for SortableJS. */
const resolveScrollTarget = (
  scrollContainerEl: HTMLElement | SVGElement | null | undefined,
): boolean | HTMLElement => {
  if (scrollContainerEl instanceof HTMLElement) {
    return scrollContainerEl;
  }

  return true;
};

/** Maps the library layout vocabulary to SortableJS direction options. */
const resolveDirection = (
  layout: ReorderLayout,
): Sortable.Options['direction'] | undefined => {
  if (layout === 'grid') {
    return undefined;
  }

  return layout;
};

/** Creates and owns a SortableJS instance for a reorder surface container. */
export const createSortableAdapter = (
  container: MaybeElementRef,
  {
    layout,
    disabled,
    interactiveSelector,
    profile,
    scrollContainer,
    callbacks,
  }: {
    layout: MaybeRefOrGetter<ReorderLayout>;
    disabled: MaybeRefOrGetter<boolean>;
    interactiveSelector?: MaybeRefOrGetter<string | undefined>;
    profile: MaybeRefOrGetter<ReorderInputProfile>;
    scrollContainer?: MaybeElementRef;
    callbacks?: ReorderEngineCallbacks;
  },
) => {
  const containerElRef = computed(() => unrefElement(container));
  const scrollContainerElRef = computed(() => unrefElement(scrollContainer));
  const sortableRef = shallowRef<Sortable>();

  /** Applies the latest reactive options to an already created SortableJS instance. */
  const applyRuntimeOptions = () => {
    const sortable = sortableRef.value;
    const resolvedProfile = toValue(profile);
    const resolvedInteractiveSelector = getReorderDescendantInteractiveSelector(
      toValue(interactiveSelector) ?? defaultReorderInteractiveSelector,
    );

    if (!sortable) {
      return;
    }

    sortable.option('disabled', toValue(disabled));
    sortable.option('animation', resolvedProfile.animation);
    sortable.option('delay', resolvedProfile.delay);
    sortable.option('touchStartThreshold', resolvedProfile.moveThreshold);
    sortable.option('fallbackTolerance', resolvedProfile.moveThreshold);
    sortable.option('forceFallback', resolvedProfile.forceFallback);
    sortable.option('fallbackOnBody', resolvedProfile.fallbackOnBody);
    sortable.option('direction', resolveDirection(toValue(layout)));
    sortable.option('filter', resolvedInteractiveSelector);
    sortable.option('scroll', resolveScrollTarget(scrollContainerElRef.value));
    sortable.option('scrollSpeed', resolvedProfile.scrollSpeed);
    sortable.option('scrollSensitivity', resolvedProfile.scrollSensitivity);
  };

  /** Tears down the current SortableJS instance, if any. */
  const destroy = () => {
    sortableRef.value?.destroy();
    sortableRef.value = undefined;
  };

  /** Creates a new SortableJS instance for the current container element. */
  const createInstance = (containerEl: HTMLElement) => {
    destroy();

    sortableRef.value = Sortable.create(containerEl, {
      animation: toValue(profile).animation,
      chosenClass: reorderClassNames.chosen,
      dataIdAttr: REORDER_ITEM_ATTRIBUTE,
      delay: toValue(profile).delay,
      disabled: toValue(disabled),
      dragClass: reorderClassNames.drag,
      draggable: reorderItemSelector,
      fallbackClass: reorderClassNames.fallback,
      fallbackOnBody: toValue(profile).fallbackOnBody,
      fallbackTolerance: toValue(profile).moveThreshold,
      filter: getReorderDescendantInteractiveSelector(
        toValue(interactiveSelector) ?? defaultReorderInteractiveSelector,
      ),
      forceAutoScrollFallback: true,
      forceFallback: toValue(profile).forceFallback,
      ghostClass: reorderClassNames.ghost,
      preventOnFilter: false,
      removeCloneOnHide: true,
      scroll: resolveScrollTarget(scrollContainerElRef.value),
      scrollSensitivity: toValue(profile).scrollSensitivity,
      scrollSpeed: toValue(profile).scrollSpeed,
      sort: true,
      touchStartThreshold: toValue(profile).moveThreshold,
      direction: resolveDirection(toValue(layout)),
      onStart: (event) => {
        callbacks?.onStart?.({
          itemId: readItemId(event.item),
          orderedIds: readOrderedIds(sortableRef.value),
          fromIndex: event.oldDraggableIndex ?? event.oldIndex ?? -1,
          toIndex: event.newDraggableIndex ?? event.newIndex ?? -1,
        });
      },
      onChange: (event) => {
        callbacks?.onChange?.({
          itemId: readItemId(event.item),
          orderedIds: readOrderedIds(sortableRef.value),
          fromIndex: event.oldDraggableIndex ?? event.oldIndex ?? -1,
          toIndex: event.newDraggableIndex ?? event.newIndex ?? -1,
        });
      },
      onEnd: (event) => {
        callbacks?.onEnd?.({
          itemId: readItemId(event.item),
          orderedIds: readOrderedIds(sortableRef.value),
          fromIndex: event.oldDraggableIndex ?? event.oldIndex ?? -1,
          toIndex: event.newDraggableIndex ?? event.newIndex ?? -1,
        });
      },
    });

    applyRuntimeOptions();
  };

  watch(
    containerElRef,
    (containerEl) => {
      if (!(containerEl instanceof HTMLElement)) {
        destroy();
        return;
      }

      createInstance(containerEl);
    },
    {
      immediate: true,
    },
  );

  watch(
    [
      () => toValue(layout),
      () => toValue(disabled),
      () => toValue(interactiveSelector),
      () => toValue(profile),
      scrollContainerElRef,
    ],
    () => {
      applyRuntimeOptions();
    },
    {
      deep: true,
    },
  );

  return {
    sortable: computed(() => sortableRef.value),
    destroy,
    sort: (orderedIds: readonly string[], useAnimation = false) => {
      sortableRef.value?.sort(orderedIds, useAnimation);
    },
    toArray: () => readOrderedIds(sortableRef.value),
    cancel: () => {
      runDrop(sortableRef.value);
    },
  };
};
