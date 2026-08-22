import { useVirtualizer } from '@tanstack/vue-virtual';
import type { ComputedRef, MaybeRefOrGetter, ObjectDirective } from 'vue';
import { computed, toValue } from 'vue';

/** Scroll axis a `useVirtualCollection` instance virtualizes. */
export type VirtualCollectionAxis = 'vertical' | 'horizontal';

/** Stable identity type accepted for a virtualized collection item. */
export type VirtualCollectionKey = string | number | bigint;

/** Provisional or computed size for one source value. */
export type EstimateSize<T> = number | ((value: T, index: number) => number);

/** Public options for {@link useVirtualCollection}. */
export interface UseVirtualCollectionOptions<T, TKey extends VirtualCollectionKey> {
  /** Explicit physical scroll element. May be `null`/`undefined` before mount. */
  root: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Stable identity for a source value at its current index. */
  key: (value: T, index: number) => TKey;
  /** Provisional size before measurement, or a per-value/index callback. */
  estimateSize: EstimateSize<T>;
  /** Axis direction. Defaults to `vertical`. */
  axis?: VirtualCollectionAxis;
  /** Narrow overscan override. */
  overscan?: number;
  /** Current distance, along the axis, from the scroll-root origin to the collection surface origin. */
  surfaceOffset?: MaybeRefOrGetter<number>;
}

/** One currently mounted virtual collection item. */
export interface VirtualCollectionItem<T, TKey extends VirtualCollectionKey> {
  /** Logical position in the current source. */
  index: number;
  /** Stable identity from `options.key(value, index)`. */
  key: TKey;
  /** Current source value at `index`. */
  value: T;
  /** Collection-surface-relative start offset in pixels along the axis. */
  offset: number;
  /** Current estimated/measured size in pixels. */
  size: number;
}

/** Public result of {@link useVirtualCollection}. */
export interface UseVirtualCollectionResult<T, TKey extends VirtualCollectionKey> {
  /** Currently mounted virtual items, ordered by index. */
  items: Readonly<ComputedRef<readonly VirtualCollectionItem<T, TKey>[]>>;
  /** Current estimated/measured collection-surface-relative extent. */
  totalSize: Readonly<ComputedRef<number>>;
  /** Collection-surface-relative extent before the first mounted item. */
  leadingSize: Readonly<ComputedRef<number>>;
  /** Collection-surface-relative extent after the last mounted item. */
  trailingSize: Readonly<ComputedRef<number>>;
  /**
   * Per-instance directive that associates the bound {@link VirtualCollectionItem} with the
   * actual measurement-owning element and delegates to engine measurement. Apply it directly to
   * the consumer-owned element that renders one virtual item.
   */
  measure: ObjectDirective<HTMLElement, VirtualCollectionItem<T, TKey>>;
}

/**
 * Mioframe-private TanStack `indexAttribute`. Consumers never read or write this attribute; the
 * returned `measure` directive owns it exclusively as the measurement identity marker.
 */
const MIOFRAME_VIRTUAL_INDEX_ATTRIBUTE = 'data-mioframe-virtual-index';

/**
 * Minimal shared boundary over `@tanstack/vue-virtual`. Owns one logical collection along one
 * axis: reactive source-to-count/key/estimate mapping, collection-relative geometry, and a
 * per-instance DOM measurement directive. TanStack remains the sole owner of range calculation,
 * `ResizeObserver`-backed observation, the measured-size cache, offsets, and scroll correction;
 * this composable adds no parallel geometry state and creates no rendering DOM.
 * @param source - Reactive logical collection to virtualize.
 * @param options - Collection configuration; see {@link UseVirtualCollectionOptions}.
 * @returns Visible items, collection-relative geometry, and the measurement directive.
 */
export function useVirtualCollection<T, TKey extends VirtualCollectionKey>(
  source: MaybeRefOrGetter<readonly T[]>,
  options: UseVirtualCollectionOptions<T, TKey>,
): UseVirtualCollectionResult<T, TKey> {
  const readSource = (): readonly T[] => toValue(source);

  const readValue = (currentSource: readonly T[], index: number): T => {
    if (index < 0 || index >= currentSource.length) {
      throw new RangeError(`useVirtualCollection: no source entry at index ${index}`);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- index validity is checked above independently of the value; noUncheckedIndexedAccess still widens this access to T | undefined even though a valid source value (including a legitimate `undefined`) exists.
    return currentSource[index] as T;
  };

  const readSurfaceOffset = (): number => toValue(options.surfaceOffset ?? 0);

  const virtualizerOptions = computed(() => {
    const currentSource = readSource();

    return {
      count: currentSource.length,
      getScrollElement: () => toValue(options.root) ?? null,
      horizontal: options.axis === 'horizontal',
      estimateSize: (index: number) => {
        const value = readValue(currentSource, index);
        return typeof options.estimateSize === 'number'
          ? options.estimateSize
          : options.estimateSize(value, index);
      },
      getItemKey: (index: number) => options.key(readValue(currentSource, index), index),
      ...(options.overscan === undefined ? {} : { overscan: options.overscan }),
      scrollMargin: readSurfaceOffset(),
      indexAttribute: MIOFRAME_VIRTUAL_INDEX_ATTRIBUTE,
    };
  });

  const virtualizer = useVirtualizer<HTMLElement, HTMLElement>(virtualizerOptions);

  const items = computed<readonly VirtualCollectionItem<T, TKey>[]>(() => {
    const currentSource = readSource();
    const surfaceOffset = readSurfaceOffset();

    return virtualizer.value.getVirtualItems().map((item) => ({
      index: item.index,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TanStack's own Key type is a fixed string|number|bigint union; the runtime value always came from our getItemKey, which returns TKey.
      key: item.key as TKey,
      value: readValue(currentSource, item.index),
      offset: item.start - surfaceOffset,
      size: item.size,
    }));
  });

  const totalSize = computed(() => virtualizer.value.getTotalSize());

  const leadingSize = computed(() => items.value[0]?.offset ?? 0);

  const trailingSize = computed(() => {
    const currentItems = items.value;
    const last = currentItems[currentItems.length - 1];
    return last ? Math.max(totalSize.value - (last.offset + last.size), 0) : 0;
  });

  function applyMeasurement(el: HTMLElement, item: VirtualCollectionItem<T, TKey>): void {
    el.setAttribute(MIOFRAME_VIRTUAL_INDEX_ATTRIBUTE, String(item.index));
    virtualizer.value.measureElement(el);
  }

  const measure: ObjectDirective<HTMLElement, VirtualCollectionItem<T, TKey>> = {
    mounted(el, binding) {
      applyMeasurement(el, binding.value);
    },
    updated(el, binding) {
      applyMeasurement(el, binding.value);
    },
  };

  return {
    items,
    totalSize,
    leadingSize,
    trailingSize,
    measure,
  };
}
