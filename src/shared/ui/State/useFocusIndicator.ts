import './md-focus-indicator.css';
import { shallowRef, watch } from 'vue';
import {
  createGlobalState,
  onKeyStroke,
  tryOnScopeDispose,
  useElementBounding,
  useEventListener,
} from '@vueuse/core';

const setupFocusIndicator = () => {
  const isKeyboardNav = shallowRef<boolean>();

  onKeyStroke(
    [
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Enter',
      ' ',
    ],
    () => {
      isKeyboardNav.value = true;
    },
    { passive: true },
  );

  useEventListener(
    ['mousedown', 'touchstart', 'pointerdown'],
    () => {
      isKeyboardNav.value = false;
    },
    { passive: true, capture: true },
  );

  const focusedEl = shallowRef<HTMLElement>();

  useEventListener(
    'focusin',
    ({ target }) => {
      if (isKeyboardNav.value && target instanceof HTMLElement) {
        focusedEl.value = target;
      }
    },
    { passive: true },
  );

  const indicatorElement = document.createElement('div');
  indicatorElement.classList.add('md-focus-indicator');
  document.body.appendChild(indicatorElement);

  const hideIndicator = () => {
    indicatorElement.style.opacity = '0';
  };

  const showIndicator = () => {
    indicatorElement.style.opacity = '1';
  };

  const moveIndicator = ({
    top,
    left,
    width,
    height,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => {
    indicatorElement.style.top = `${top}px`;
    indicatorElement.style.left = `${left}px`;
    indicatorElement.style.width = `${width}px`;
    indicatorElement.style.height = `${height}px`;
  };

  const { top, left, width, height } = useElementBounding(focusedEl, {
    immediate: true,
    updateTiming: 'next-frame',
    reset: false,
  });

  useEventListener(window, 'blur', () => {
    focusedEl.value = undefined;
  });

  const borderRadius = shallowRef<string>();

  watch(
    focusedEl,
    (focusedEl) => {
      if (focusedEl && !focusedEl.classList.contains('md-focus-indicator_hidden')) {
        showIndicator();
        const styles = getComputedStyle(focusedEl);
        borderRadius.value = styles.borderRadius;
      } else {
        hideIndicator();
      }
    },
    { immediate: true },
  );

  watch(
    borderRadius,
    (borderRadius) => {
      indicatorElement.style.borderRadius = borderRadius ?? '';
    },
    { immediate: true },
  );

  watch(
    [top, left, width, height],
    ([top, left, width, height]) => {
      moveIndicator({ top, left, width, height });
    },
    {
      immediate: true,
    },
  );

  watch(
    isKeyboardNav,
    (isKeyboardNav) => {
      if (isKeyboardNav) {
        showIndicator();
      } else {
        hideIndicator();
      }
    },
    {
      immediate: true,
    },
  );

  tryOnScopeDispose(() => {
    indicatorElement.remove();
  });
};

export const useFocusIndicator = createGlobalState(setupFocusIndicator);
