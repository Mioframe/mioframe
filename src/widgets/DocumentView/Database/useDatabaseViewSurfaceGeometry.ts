import { useElementBounding } from '@vueuse/core';
import { computed, onMounted, onUpdated, toValue, type MaybeRefOrGetter } from 'vue';

/**
 * Owns the Database widget's root-to-layout surface measurements.
 * @param databaseViewRef - Physical Database scroll-root reference.
 * @param databaseViewLayoutRef - Database layout surface reference.
 * @returns Reactive vertical and horizontal root-to-surface offsets.
 */
export const useDatabaseViewSurfaceGeometry = (
  databaseViewRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
  databaseViewLayoutRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
) => {
  const databaseViewBounds = useElementBounding(databaseViewRef);
  const databaseViewLayoutBounds = useElementBounding(databaseViewLayoutRef);

  const updateDatabaseSurfaceBounds = () => {
    databaseViewBounds.update();
    databaseViewLayoutBounds.update();
  };

  onMounted(updateDatabaseSurfaceBounds);
  onUpdated(updateDatabaseSurfaceBounds);

  const verticalSurfaceOffset = computed(() => {
    const root = toValue(databaseViewRef);

    if (!root || !toValue(databaseViewLayoutRef)) {
      return 0;
    }

    return (
      databaseViewLayoutBounds.top.value -
      databaseViewBounds.top.value -
      root.clientTop +
      root.scrollTop
    );
  });

  const horizontalSurfaceOffset = computed(() => {
    const root = toValue(databaseViewRef);

    if (!root || !toValue(databaseViewLayoutRef)) {
      return 0;
    }

    return (
      databaseViewLayoutBounds.left.value -
      databaseViewBounds.left.value -
      root.clientLeft +
      root.scrollLeft
    );
  });

  return { verticalSurfaceOffset, horizontalSurfaceOffset };
};
