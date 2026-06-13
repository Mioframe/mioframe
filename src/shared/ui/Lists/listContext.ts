import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';

/** Shared visual treatment for list containers. */
export type MDListStyle = 'standard' | 'segmented';
/** Material density profile for list row sizing. */
export type MDListDensity = 'baseline' | 'expressive';

/** Reactive list container state shared with descendant items. */
export interface MDListContextValue {
  /** Active density profile for descendant rows. */
  density: ComputedRef<MDListDensity>;
  /** Semantic wrapper tag each item should render. */
  itemTag: ComputedRef<'div' | 'li'>;
  /** Material row heights keyed by resolved line count. */
  lineHeights: ComputedRef<Record<1 | 2 | 3, number>>;
  /** Active container style variant. */
  listStyle: ComputedRef<MDListStyle>;
  /** Whether descendants should render list semantics. */
  usesListSemantics: ComputedRef<boolean>;
}

const LIST_CONTEXT_KEY: InjectionKey<MDListContextValue> = Symbol('md-list-context');

/**
 * Provides shared list semantics and sizing to descendant list items.
 * @param listStyle - Reactive list style variant.
 * @param density - Reactive list density profile.
 * @param tag - Reactive semantic container tag.
 */
export const provideMDListContext = (
  listStyle: Ref<MDListStyle> | ComputedRef<MDListStyle>,
  density: Ref<MDListDensity> | ComputedRef<MDListDensity>,
  tag: Ref<'div' | 'ul'> | ComputedRef<'div' | 'ul'>,
) => {
  provide(LIST_CONTEXT_KEY, {
    density: computed(() => density.value),
    itemTag: computed(() => (tag.value === 'ul' ? 'li' : 'div')),
    lineHeights: computed(() =>
      density.value === 'baseline' ? { 1: 56, 2: 72, 3: 88 } : { 1: 48, 2: 64, 3: 80 },
    ),
    listStyle: computed(() => listStyle.value),
    usesListSemantics: computed(() => true),
  });
};

/**
 * Reads the nearest list container context when an item is rendered inside a list.
 * @returns The nearest list context, or `null` when rendered outside a list.
 */
export const useMDListContext = () => inject(LIST_CONTEXT_KEY, null);
