import type { MaybeElementRef } from '@vueuse/core';
import { unrefElement, useEventListener } from '@vueuse/core';
import './ripple.css';

import { computed } from 'vue';
import { toNumber } from 'es-toolkit/compat';
import { debounce } from 'perfect-debounce';

const asyncRequestAnimationFrame = () => new Promise(requestAnimationFrame);

const startRipple = async ({
  target,
  clientX,
  clientY,
}: {
  target: Element;
  clientX: number;
  clientY: number;
}) => {
  const { left, top, right, bottom } = target.getBoundingClientRect();
  const offsetX = clientX - left;
  const offsetY = clientY - top;

  const diameter =
    Math.max(
      Math.hypot(left - clientX, top - clientY),
      Math.hypot(right - clientX, top - clientY),
      Math.hypot(left - clientX, bottom - clientY),
      Math.hypot(right - clientX, bottom - clientY),
    ) * 2;

  const rippleEl = document.createElement('div');
  rippleEl.classList.add('md-ripple');
  rippleEl.style.setProperty('--md-ripple-y', `${offsetY}px`);
  rippleEl.style.setProperty('--md-ripple-x', `${offsetX}px`);
  rippleEl.style.setProperty('--md-ripple-diameter', `${diameter}px`);

  const mdStateTarget = target.querySelector(':scope > .md-state__target');

  if (mdStateTarget) {
    mdStateTarget.before(rippleEl);
  } else {
    target.prepend(rippleEl);
  }

  const duration = 1e3;

  await asyncRequestAnimationFrame();

  const animate = rippleEl.animate(
    [
      {
        '--md-ripple-opacity': 1,
        '--md-ripple-scale': 0,
      },
      {
        '--md-ripple-opacity': 1,
        '--md-ripple-scale': 1,
      },
      {
        '--md-ripple-opacity': 0,
        '--md-ripple-scale': 1,
      },
    ],
    { duration },
  );

  animate.addEventListener('finish', () => {
    rippleEl.remove();
  });

  return animate;
};

let lastTarget: Element | undefined = undefined;

export const useRipple = (rawEl: MaybeElementRef) => {
  const el = computed(() => unrefElement(rawEl));

  let lastAnimation: Animation | undefined = undefined;

  const onPressDown = async ({
    target,
    clientX,
    clientY,
  }: {
    target: EventTarget | null;
    clientX: number;
    clientY: number;
  }) => {
    if (
      target instanceof Element &&
      target === unrefElement(el) &&
      (!lastTarget || !target.contains(lastTarget))
    ) {
      lastTarget = target;

      lastAnimation = await startRipple({
        clientX,
        clientY,
        target,
      });
    }
  };

  const onPressUp = () => {
    lastTarget = undefined;
    if (lastAnimation?.effect instanceof KeyframeEffect) {
      const { target } = lastAnimation.effect;
      if (target instanceof Element) {
        const newDuration = 200;

        const oldDuration = toNumber(lastAnimation.effect.getTiming().duration);

        lastAnimation.playbackRate = oldDuration / newDuration;
      }
    }
  };

  useEventListener(
    el,
    'pointerdown',
    ({ currentTarget: target, clientX, clientY }: PointerEvent) => {
      void onPressDown({ clientX, clientY, target });
    },
    { passive: true },
  );

  useEventListener(
    el,
    [
      'pointerup',
      'pointerout',
      'pointerleave',
      'touchend',
      'touchcancel',
      'keyup',
      'touchmove',
      'pointermove',
    ],
    () => {
      onPressUp();
    },
  );

  const onKeyDownDebounce = debounce(
    ({ currentTarget, key }: KeyboardEvent) => {
      if (key === ' ' || key === 'Enter') {
        if (currentTarget instanceof Element) {
          void onPressDown({ clientX: 0, clientY: 0, target: currentTarget });
        }
      }
    },
    500,
    {
      leading: true,
    },
  );

  useEventListener(
    el,
    'keydown',
    (e: KeyboardEvent) => void onKeyDownDebounce(e),
  );
};
