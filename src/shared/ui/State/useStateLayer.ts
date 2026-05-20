import { syncRefs } from '@vueuse/core';
import { computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { useLastHover } from '@shared/lib/useLastHover';
import { usePressed } from './usePressed';
import { useRipple } from './useRipple';

type UseStateLayerOptions = {
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  autofocus?: MaybeRefOrGetter<boolean | undefined>;
  enableRipple?: MaybeRefOrGetter<boolean | undefined>;
  hover?: Ref<boolean | undefined>;
  focused?: Ref<boolean | undefined>;
  dragged?: Ref<boolean | undefined>;
};

/**
 * Collect host interaction state for a Material state layer without owning host semantics.
 * @param el - Host element ref that receives focus, hover, press, and ripple tracking.
 * @param options - Optional visual-state controls for disabled, autofocus, ripple, and drag.
 * @returns Reactive state flags that a host component can pass to `MDStateLayer`.
 */
export const useStateLayer = (el: Ref<HTMLElement | null>, options: UseStateLayerOptions = {}) => {
  const disabled = computed(() => !!toValue(options.disabled));
  const enableRipple = computed(() => !!toValue(options.enableRipple) && !disabled.value);

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

  useRipple(computed(() => (enableRipple.value ? el.value : undefined)));

  watch(
    [() => toValue(options.autofocus), el],
    ([shouldAutofocus, element]) => {
      if (shouldAutofocus && element) {
        element.focus();
      }
    },
    { immediate: true },
  );

  return {
    hover,
    focused,
    pressed,
    durationPressedState,
    dragged,
  };
};
