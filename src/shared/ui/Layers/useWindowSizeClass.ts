import { useWindowSize } from '@vueuse/core';
import { computed } from 'vue';

export enum WindowClass {
  Compact,
  Medium,
  Expanded,
  Large,
  ExtraLarge,
}

export const useWindowSizeClass = () => {
  const { width: windowWidth } = useWindowSize();

  const windowClass = computed((): WindowClass => {
    if (windowWidth.value < 600) {
      return WindowClass.Compact;
    }
    if (windowWidth.value < 840) {
      return WindowClass.Medium;
    }
    if (windowWidth.value < 1200) {
      return WindowClass.Expanded;
    }
    if (windowWidth.value < 1600) {
      return WindowClass.Large;
    }
    return WindowClass.ExtraLarge;
  });

  return {
    windowClass,
    windowWidth,
  };
};
