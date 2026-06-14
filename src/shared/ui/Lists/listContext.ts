import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';

/** Shared visual treatment for list containers. */
export type MDListStyle = 'standard' | 'segmented';
/** Controlled list-level selection mode. */
export type MDListSelectionMode = 'none' | 'single' | 'multiple';
/** Primitive selection values supported by the shared list contract. */
export type MDListSelectionValue = boolean | number | string;

/** Controlled selection payload accepted by `MDList`. */
export type MDListModelValue = MDListSelectionValue | readonly MDListSelectionValue[] | undefined;

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
 */
export const provideMDListContext = (
  listStyle: Ref<MDListStyle> | ComputedRef<MDListStyle>,
  tag: Ref<'div' | 'ul'> | ComputedRef<'div' | 'ul'>,
  selectionMode: Ref<MDListSelectionMode> | ComputedRef<MDListSelectionMode>,
  modelValue: Ref<MDListModelValue> | ComputedRef<MDListModelValue>,
  onUpdateModelValue: (value: MDListModelValue) => void,
) => {
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

  provide(LIST_CONTEXT_KEY, {
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
  });
};

/**
 * Reads the nearest list container context when an item is rendered inside a list.
 * @returns The nearest list context, or `null` when rendered outside a list.
 */
export const useMDListContext = () => inject(LIST_CONTEXT_KEY, null);
