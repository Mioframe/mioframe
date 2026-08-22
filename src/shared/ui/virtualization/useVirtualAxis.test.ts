import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useVirtualAxis } from './useVirtualAxis';
import type { UseVirtualAxisOptions, UseVirtualAxisResult } from './useVirtualAxis';

const mountVirtualAxis = <TKey extends string | number>(
  options: UseVirtualAxisOptions<TKey>,
): { scope: ReturnType<typeof effectScope>; axis: UseVirtualAxisResult<TKey> } => {
  const scope = effectScope();
  let axis!: UseVirtualAxisResult<TKey>;

  scope.run(() => {
    axis = useVirtualAxis(options);
  });

  return { scope, axis };
};

const baseOptions = (
  overrides: Partial<UseVirtualAxisOptions<number>> = {},
): UseVirtualAxisOptions<number> => ({
  count: 100,
  getItemKey: (index) => index,
  getScrollElement: () => document.createElement('div'),
  orientation: 'vertical',
  estimateSize: () => 40,
  ...overrides,
});

describe('useVirtualAxis', () => {
  it('exposes a bounded estimate-based totalSize derived from count and estimateSize', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions({ count: 100, estimateSize: () => 40 }));

    expect(axis.totalSize.value).toBe(4000);

    scope.stop();
  });

  it('recomputes totalSize when reactive count changes', async () => {
    const count = ref(10);
    const { scope, axis } = mountVirtualAxis(baseOptions({ count, estimateSize: () => 10 }));

    expect(axis.totalSize.value).toBe(100);

    count.value = 20;
    await nextTick();
    expect(axis.totalSize.value).toBe(200);

    scope.stop();
  });

  it('associates a measured element with its logical index through the private attribute', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions());
    const element = document.createElement('div');

    axis.measureElement(3, element);

    expect(element.getAttribute('data-mioframe-virtual-index')).toBe('3');
    expect(element.hasAttribute('data-index')).toBe(false);

    scope.stop();
  });

  it('forwards null measurement cleanup without throwing', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions());

    expect(() => {
      axis.measureElement(0, null);
    }).not.toThrow();

    scope.stop();
  });

  it('is a no-op scrollToIndex when count is zero', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions({ count: 0 }));

    expect(() => {
      axis.scrollToIndex(0);
    }).not.toThrow();

    scope.stop();
  });

  it('scrolls to a valid index without throwing', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions({ count: 100 }));

    expect(() => {
      axis.scrollToIndex(50, { align: 'center' });
    }).not.toThrow();

    scope.stop();
  });

  it('rejects a non-finite/negative/non-integer count', () => {
    expect(() => mountVirtualAxis(baseOptions({ count: -1 }))).toThrow(RangeError);
    expect(() => mountVirtualAxis(baseOptions({ count: 1.5 }))).toThrow(RangeError);
    expect(() => mountVirtualAxis(baseOptions({ count: Number.NaN }))).toThrow(RangeError);
  });

  it('rejects a negative or non-integer overscan', () => {
    expect(() => mountVirtualAxis(baseOptions({ overscan: -1 }))).toThrow(RangeError);
    expect(() => mountVirtualAxis(baseOptions({ overscan: 1.5 }))).toThrow(RangeError);
  });

  it('rejects an estimateSize result that is not finite and greater than 0', () => {
    // No scroll element yet: TanStack has nothing to observe, so measurement
    // stays lazy and the throw surfaces synchronously from the explicit read below
    // instead of from an internal ResizeObserver-driven recompute.
    const { scope, axis } = mountVirtualAxis(
      baseOptions({ getScrollElement: () => null, estimateSize: () => 0 }),
    );
    expect(() => axis.totalSize.value).toThrow(RangeError);
    scope.stop();

    const negative = mountVirtualAxis(
      baseOptions({ getScrollElement: () => null, estimateSize: () => -5 }),
    );
    expect(() => negative.axis.totalSize.value).toThrow(RangeError);
    negative.scope.stop();
  });

  it('rejects a negative scrollMargin/scrollPaddingStart/scrollPaddingEnd', () => {
    expect(() => mountVirtualAxis(baseOptions({ scrollMargin: -1 }))).toThrow(RangeError);
    expect(() => mountVirtualAxis(baseOptions({ scrollPaddingStart: -1 }))).toThrow(RangeError);
    expect(() => mountVirtualAxis(baseOptions({ scrollPaddingEnd: -1 }))).toThrow(RangeError);
  });

  it('rejects an out-of-range non-null measurement index', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions({ count: 10 }));
    const element = document.createElement('div');

    expect(() => {
      axis.measureElement(-1, element);
    }).toThrow(RangeError);
    expect(() => {
      axis.measureElement(10, element);
    }).toThrow(RangeError);
    expect(() => {
      axis.measureElement(1.5, element);
    }).toThrow(RangeError);

    scope.stop();
  });

  it('rejects an out-of-range scrollToIndex target', () => {
    const { scope, axis } = mountVirtualAxis(baseOptions({ count: 10 }));

    expect(() => {
      axis.scrollToIndex(-1);
    }).toThrow(RangeError);
    expect(() => {
      axis.scrollToIndex(10);
    }).toThrow(RangeError);
    expect(() => {
      axis.scrollToIndex(1.5);
    }).toThrow(RangeError);

    scope.stop();
  });

  it('cleans up without throwing when the owning scope stops', () => {
    const { scope } = mountVirtualAxis(baseOptions());

    expect(() => {
      scope.stop();
    }).not.toThrow();
  });
});
