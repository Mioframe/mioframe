import { ref, watch } from 'vue';
import './md-focus-indicator.css';
import type { MaybeElement } from '@vueuse/core';
import {
  createGlobalState,
  unrefElement,
  useElementBounding,
} from '@vueuse/core';
import { throttle } from 'es-toolkit';

export const useFocusIndicator = createGlobalState(() => {
  let indicatorEl: HTMLDivElement | undefined;

  const mountedIndicator = () => {
    if (!indicatorEl) {
      indicatorEl = window.document.createElement('div');
      indicatorEl.classList.add('md-focus-indicator');
      window.document.body.append(indicatorEl);
    }

    return indicatorEl;
  };

  const targetRef = ref<MaybeElement>();

  const { top, left, width, height } = useElementBounding(targetRef);

  watch(
    [targetRef, top, left, width, height],
    throttle(() => {
      const targetEl = unrefElement(targetRef);
      if (
        targetEl &&
        width.value &&
        height.value &&
        (top.value || left.value)
      ) {
        const el = mountedIndicator();
        el.style.top = `${top.value}px`;
        el.style.left = `${left.value}px`;
        el.style.width = `${width.value}px`;
        el.style.height = `${height.value}px`;
        const borderRadius = getComputedStyle(targetEl).borderRadius;
        el.style.borderRadius = borderRadius;
        el.style.opacity = '1';
      } else {
        const el = mountedIndicator();
        el.style.opacity = '0';
      }
    }, 1e3 / 30),
    { immediate: true },
  );

  const showFocus = (targetEl: MaybeElement) => {
    targetRef.value = targetEl;
    return () => {
      removeFocus(targetEl);
    };
  };

  const removeFocus = (targetEl: MaybeElement) => {
    if (targetRef.value === targetEl) {
      targetRef.value = undefined;
    }
  };

  return {
    showFocus,
    removeFocus,
  };
});
