import { useVirtualizer } from '@tanstack/vue-virtual';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

/** Scroll axis a `useVirtualAxis` instance virtualizes. */
export type VirtualAxisOrientation = 'vertical' | 'horizontal';

/** Stable identity type accepted for a virtualized item. */
export type VirtualAxisKey = string | number;

/** Deep-navigation alignment accepted by {@link UseVirtualAxisResult.scrollToIndex}. */
export type VirtualAxisAlign = 'auto' | 'start' | 'center' | 'end';

/** Public options for {@link useVirtualAxis}. */
export interface UseVirtualAxisOptions<TKey extends VirtualAxisKey> {
  /** Reactive logical item count. Must resolve to a finite non-negative integer. */
  count: MaybeRefOrGetter<number>;
  /** Stable identity for the logical item at `index`. */
  getItemKey: (index: number) => TKey;
  /** Axis scroll element, or `null`/`undefined` before mount. */
  getScrollElement: () => HTMLElement | null | undefined;
  /** Axis direction. Not required to be reactive. */
  orientation: VirtualAxisOrientation;
  /** Provisional size for an item before it has been measured. Must return a finite value greater than 0. */
  estimateSize: (index: number) => number;
  /** Narrow overscan override. Must resolve to a finite non-negative integer when provided. */
  overscan?: number;
  /** Reactive offset from the scroll root origin to the virtual surface origin. */
  scrollMargin?: MaybeRefOrGetter<number>;
  /** Reactive occlusion used by deep navigation at the leading edge, for example a sticky header. */
  scrollPaddingStart?: MaybeRefOrGetter<number>;
  /** Reactive occlusion used by deep navigation at the trailing edge, for example a sticky action surface. */
  scrollPaddingEnd?: MaybeRefOrGetter<number>;
}

/** One currently mounted virtual item. */
export interface VirtualAxisItem<TKey extends VirtualAxisKey> {
  /** Logical position in the current collection. */
  index: number;
  /** Stable identity from `getItemKey(index)`. */
  key: TKey;
  /** Start offset in pixels along the axis, including `scrollMargin`. */
  start: number;
  /** Current estimated/measured size in pixels. */
  size: number;
  /** End offset in pixels along the axis (`start + size`). */
  end: number;
}

/** Public result of {@link useVirtualAxis}. */
export interface UseVirtualAxisResult<TKey extends VirtualAxisKey> {
  /** Currently mounted virtual items, ordered by index. */
  virtualItems: Readonly<ComputedRef<readonly VirtualAxisItem<TKey>[]>>;
  /** Current estimated/measured axis extent. */
  totalSize: Readonly<ComputedRef<number>>;
  /**
   * Associates a rendered logical `index` with its mounted DOM `element` and delegates to
   * engine measurement. Pass `null` on unmount to forward cleanup.
   */
  measureElement(index: number, element: HTMLElement | null): void;
  /** Scrolls so the logical item at `index` enters the virtual range. */
  scrollToIndex(index: number, options?: { align?: VirtualAxisAlign }): void;
}

/**
 * Mioframe-private TanStack `indexAttribute`. Consumers never read or write this attribute;
 * `measureElement` owns it exclusively as the measurement identity marker.
 */
const MIOFRAME_INDEX_ATTRIBUTE = 'data-mioframe-virtual-index';

function assertFiniteNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `useVirtualAxis: ${name} must be a finite non-negative integer, received ${value}`,
    );
  }
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`useVirtualAxis: ${name} must be finite and >= 0, received ${value}`);
  }
}

/**
 * Narrow Mioframe adapter over `@tanstack/vue-virtual`. Owns one virtual axis: reactive count,
 * dynamic DOM measurement, overscan, scroll margin/padding, and deep navigation. TanStack remains
 * the sole owner of ResizeObserver-backed observation, the measured-size cache, ranges, offsets,
 * and scroll correction; this adapter adds no parallel geometry state.
 * @param options - Axis configuration; see {@link UseVirtualAxisOptions}.
 * @returns The axis's public geometry and measurement/navigation API.
 */
export function useVirtualAxis<TKey extends VirtualAxisKey>(
  options: UseVirtualAxisOptions<TKey>,
): UseVirtualAxisResult<TKey> {
  const readCount = (): number => {
    const count = toValue(options.count);
    assertFiniteNonNegativeInteger(count, 'count');
    return count;
  };

  if (options.overscan !== undefined) {
    assertFiniteNonNegativeInteger(options.overscan, 'overscan');
  }

  const estimateSize = (index: number): number => {
    const size = options.estimateSize(index);
    if (!Number.isFinite(size) || size <= 0) {
      throw new RangeError(
        `useVirtualAxis: estimateSize(${index}) must return a finite value greater than 0, received ${size}`,
      );
    }
    return size;
  };

  const virtualizerOptions = computed(() => {
    const scrollMargin = toValue(options.scrollMargin ?? 0);
    assertFiniteNonNegative(scrollMargin, 'scrollMargin');

    const scrollPaddingStart = toValue(options.scrollPaddingStart ?? 0);
    assertFiniteNonNegative(scrollPaddingStart, 'scrollPaddingStart');

    const scrollPaddingEnd = toValue(options.scrollPaddingEnd ?? 0);
    assertFiniteNonNegative(scrollPaddingEnd, 'scrollPaddingEnd');

    return {
      count: readCount(),
      getScrollElement: () => options.getScrollElement() ?? null,
      horizontal: options.orientation === 'horizontal',
      estimateSize,
      ...(options.overscan === undefined ? {} : { overscan: options.overscan }),
      getItemKey: options.getItemKey,
      scrollMargin,
      scrollPaddingStart,
      scrollPaddingEnd,
      indexAttribute: MIOFRAME_INDEX_ATTRIBUTE,
    };
  });

  const virtualizer = useVirtualizer<HTMLElement, HTMLElement>(virtualizerOptions);

  const virtualItems = computed<readonly VirtualAxisItem<TKey>[]>(() =>
    virtualizer.value.getVirtualItems().map((item) => ({
      index: item.index,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- TanStack's own Key type is a fixed string|number|bigint union; the runtime value always came from our getItemKey, which returns TKey.
      key: item.key as TKey,
      start: item.start,
      size: item.size,
      end: item.end,
    })),
  );

  const totalSize = computed(() => virtualizer.value.getTotalSize());

  function measureElement(index: number, element: HTMLElement | null): void {
    if (element === null) {
      virtualizer.value.measureElement(null);
      return;
    }

    const count = readCount();
    if (!Number.isInteger(index) || index < 0 || index >= count) {
      throw new RangeError(
        `useVirtualAxis: measureElement index must be an integer within [0, ${count}), received ${index}`,
      );
    }

    element.setAttribute(MIOFRAME_INDEX_ATTRIBUTE, String(index));
    virtualizer.value.measureElement(element);
  }

  function scrollToIndex(index: number, scrollOptions?: { align?: VirtualAxisAlign }): void {
    const count = readCount();
    if (count === 0) {
      return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= count) {
      throw new RangeError(
        `useVirtualAxis: scrollToIndex target must be an integer within [0, ${count}), received ${index}`,
      );
    }

    virtualizer.value.scrollToIndex(index, { align: scrollOptions?.align ?? 'auto' });
  }

  return {
    virtualItems,
    totalSize,
    measureElement,
    scrollToIndex,
  };
}
