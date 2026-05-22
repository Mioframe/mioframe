import { syncRefs } from '@vueuse/core';
import { ref, type Ref } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { useLastHover } from '@shared/lib/useLastHover';
import { usePressed } from './usePressed';

type UseStateLayerOptions = {
  hover?: Ref<boolean | undefined>;
  focused?: Ref<boolean | undefined>;
  dragged?: Ref<boolean | undefined>;
};

/**
 * Collect host interaction state for a Material state layer without owning host semantics.
 * @param el - Host element ref that receives focus, hover, and press tracking.
 * @param options - Optional sinks for host-owned hover, focus, and drag state.
 * @returns Reactive state flags that a host component can pass to `MDStateLayer`.
 */
export const useStateLayer = (el: Ref<HTMLElement | null>, options: UseStateLayerOptions = {}) => {
  const { pressed, durationPressedState } = usePressed(el);
  const hover = useLastHover(el);
  const { focused } = useFirstFocus(el, {
    useTarget: true,
    focusVisible: true,
  });
  const dragged = options.dragged ?? ref(false);

  if (options.hover) {
    syncRefs(hover, options.hover);
  }

  if (options.focused) {
    syncRefs(focused, options.focused);
  }

  return {
    hover,
    focused,
    pressed,
    durationPressedState,
    dragged,
  };
};
