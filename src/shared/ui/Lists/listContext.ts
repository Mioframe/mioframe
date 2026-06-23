import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';

/** Shared visual treatment for list containers. */
export type MDListStyle = 'standard' | 'segmented';
/** Controlled list-level selection mode. */
export type MDListSelectionMode = 'none' | 'single' | 'multiple';
/** Primitive selection values supported by the shared list contract. */
export type MDListSelectionValue = boolean | number | string;

/** Controlled selection payload accepted by `MDList`. */
export type MDListModelValue = MDListSelectionValue | readonly MDListSelectionValue[] | undefined;

/** Live registration contract for one selection item owned by an `MDList`. */
export interface MDListSelectionItemRecord {
  /** Returns the current rendered option root element. */
  getElement: () => HTMLElement | null;
  /** Returns the current disabled state used by roving focus. */
  isDisabled: () => boolean;
  /** Returns the current selected state used by initial tab-stop sync. */
  isSelected: () => boolean;
}

/** Vue-owned registry of selection items for one `MDList` listbox context. */
export interface MDListSelectionRegistry {
  /** Returns the current registered items for this list only. */
  getItems: () => readonly MDListSelectionItemRecord[];
  /** Registers one owned item and returns its unregister callback. */
  registerItem: (item: MDListSelectionItemRecord) => () => void;
}

/** Live registration contract for one single-action/multi-action row owned by an `MDList`. */
export interface MDListActionItemRecord {
  /** Returns the current primary action element, or null when not yet mounted. */
  getPrimaryElement: () => HTMLElement | null;
  /** Returns the current trailing action's focusable element, or null when absent. */
  getTrailingElement: () => HTMLElement | null;
  /** Returns whether the primary action is currently disabled. */
  isPrimaryDisabled: () => boolean;
}

/** Vue-owned registry of single-action/multi-action rows for one `MDList` instance. */
export interface MDListActionRegistry {
  /** Returns the current registered rows for this list only. */
  getItems: () => readonly MDListActionItemRecord[];
  /** Registers one owned row and returns its unregister callback. */
  registerItem: (item: MDListActionItemRecord) => () => void;
}

/** Reactive list container state shared with descendant items. */
export interface MDListContextValue {
  /** Semantic wrapper tag each item should render. */
  itemTag: ComputedRef<'div' | 'li'>;
  /** Active container style variant. */
  listStyle: ComputedRef<MDListStyle>;
  /** Active list-level selection mode. */
  selectionMode: ComputedRef<MDListSelectionMode>;
  /** Whether descendants should render list semantics. */
  usesListSemantics: ComputedRef<boolean>;
  /** Checks whether a value is selected by the controlled list state. */
  isItemSelected: (value: MDListSelectionValue | undefined) => boolean;
  /** Requests a controlled selection update from the list owner. */
  selectItem: (value: MDListSelectionValue | undefined) => void;
  /** Vue-owned selection registry for this list's option items. */
  selectionRegistry: MDListSelectionRegistry;
  /** Vue-owned registry for this list's single-action/multi-action rows. */
  actionRegistry: MDListActionRegistry;
}

const LIST_CONTEXT_KEY: InjectionKey<MDListContextValue> = Symbol('md-list-context');

const isSelectionValue = (value: unknown): value is MDListSelectionValue =>
  typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';

const includesValue = (
  selection: readonly MDListSelectionValue[],
  value: MDListSelectionValue,
): boolean => selection.some((entry) => Object.is(entry, value));

/**
 * Provides shared list semantics to descendant list items.
 * @param listStyle - Reactive list style variant.
 * @param tag - Reactive semantic container tag.
 * @param selectionMode - Reactive selection mode.
 * @param modelValue - Reactive controlled selection state.
 * @param onUpdateModelValue - Controlled selection update callback.
 * @returns The provided list context value for same-component consumers.
 */
export const provideMDListContext = (
  listStyle: Ref<MDListStyle> | ComputedRef<MDListStyle>,
  tag: Ref<'div' | 'ul'> | ComputedRef<'div' | 'ul'>,
  selectionMode: Ref<MDListSelectionMode> | ComputedRef<MDListSelectionMode>,
  modelValue: Ref<MDListModelValue> | ComputedRef<MDListModelValue>,
  onUpdateModelValue: (value: MDListModelValue) => void,
) => {
  const selectionItems: MDListSelectionItemRecord[] = [];
  const actionItems: MDListActionItemRecord[] = [];
  const selectedValues = computed<readonly MDListSelectionValue[]>(() => {
    if (selectionMode.value === 'none') {
      return [];
    }

    const value = modelValue.value;

    if (selectionMode.value === 'multiple') {
      return Array.isArray(value) ? value.filter(isSelectionValue) : [];
    }

    return isSelectionValue(value) ? [value] : [];
  });

  const contextValue: MDListContextValue = {
    itemTag: computed(() => (tag.value === 'ul' ? 'li' : 'div')),
    listStyle: computed(() => listStyle.value),
    selectionMode: computed(() => selectionMode.value),
    usesListSemantics: computed(() => true),
    isItemSelected(value) {
      if (!isSelectionValue(value) || selectionMode.value === 'none') {
        return false;
      }

      return includesValue(selectedValues.value, value);
    },
    selectItem(value) {
      if (!isSelectionValue(value) || selectionMode.value === 'none') {
        return;
      }

      if (selectionMode.value === 'single') {
        onUpdateModelValue(value);
        return;
      }

      const nextValues = includesValue(selectedValues.value, value)
        ? selectedValues.value.filter((entry) => !Object.is(entry, value))
        : [...selectedValues.value, value];

      onUpdateModelValue(nextValues);
    },
    selectionRegistry: {
      getItems: () => selectionItems,
      registerItem(item) {
        selectionItems.push(item);

        return () => {
          const index = selectionItems.indexOf(item);

          if (index >= 0) {
            selectionItems.splice(index, 1);
          }
        };
      },
    },
    actionRegistry: {
      getItems: () => actionItems,
      registerItem(item) {
        actionItems.push(item);

        return () => {
          const index = actionItems.indexOf(item);

          if (index >= 0) {
            actionItems.splice(index, 1);
          }
        };
      },
    },
  };

  provide(LIST_CONTEXT_KEY, contextValue);

  return contextValue;
};

/**
 * Reads the nearest list container context when an item is rendered inside a list.
 * @returns The nearest list context, or `null` when rendered outside a list.
 */
export const useMDListContext = () => inject(LIST_CONTEXT_KEY, null);
