import type { MaybeComputedElementRef } from '@vueuse/core';
import { useElementSize } from '@vueuse/core';
import { computed } from 'vue';

export enum LayoutClass {
  Compact = 'compact',
  Medium = 'medium',
  Expanded = 'expanded',
  Large = 'large',
  ExtraLarge = 'extraLarge',
}

export const useLayoutSizeClass = (target: MaybeComputedElementRef) => {
  const { width: layoutWidth } = useElementSize(target);

  const layoutClass = computed((): LayoutClass => {
    if (layoutWidth.value < 600) {
      return LayoutClass.Compact;
    }
    if (layoutWidth.value < 840) {
      return LayoutClass.Medium;
    }
    if (layoutWidth.value < 1200) {
      return LayoutClass.Expanded;
    }
    if (layoutWidth.value < 1600) {
      return LayoutClass.Large;
    }
    return LayoutClass.ExtraLarge;
  });

  return {
    layoutClass,
    layoutWidth,
  };
};
