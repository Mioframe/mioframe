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
  // The element whose bounding box and border-radius drives the indicator position.
  // When the focused element nominates an internal focus target via
  // data-md-focus-indicator-target, that descendant is used instead of the host.
  const boundingSourceEl = shallowRef<HTMLElement>();

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

  const { top, left, width, height } = useElementBounding(boundingSourceEl, {
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
    (nextFocusedEl) => {
      if (nextFocusedEl && !nextFocusedEl.classList.contains('md-focus-indicator_hidden')) {
        showIndicator();
        // eslint-disable-next-line no-restricted-syntax -- justified: reads a generic focus-target marker from non-Vue DOM, not Vue component coordination
        const target = nextFocusedEl.querySelector('[data-md-focus-indicator-target]');
        const source = target instanceof HTMLElement ? target : nextFocusedEl;
        boundingSourceEl.value = source;
        const styles = getComputedStyle(source);
        borderRadius.value = styles.borderRadius;
      } else {
        boundingSourceEl.value = undefined;
        hideIndicator();
      }
    },
    { immediate: true },
  );

  watch(
    borderRadius,
    (nextBorderRadius) => {
      indicatorElement.style.borderRadius = nextBorderRadius ?? '';
    },
    { immediate: true },
  );

  watch(
    [top, left, width, height],
    ([nextTop, nextLeft, nextWidth, nextHeight]) => {
      moveIndicator({ top: nextTop, left: nextLeft, width: nextWidth, height: nextHeight });
    },
    {
      immediate: true,
    },
  );

  watch(
    isKeyboardNav,
    (isKeyboardNavigation) => {
      if (isKeyboardNavigation) {
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
