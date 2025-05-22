import { uniqueId, type UniqueId } from '@shared/lib/uniqueId';
import { reactive, ref } from 'vue';
import { RippleAnimation } from './types';
import { createLogger } from '@shared/lib/logger';

const { debug } = createLogger('setupRipple');

export const setupRipple = () => {
  type RippleId = UniqueId<'ripple'>;

  type RippleOptions = {
    state: 'enter' | 'leave' | 'default';
    offsetX: number;
    offsetY: number;
    diameter: number;
  };

  const rippleSet = reactive<Map<RippleId, RippleOptions>>(new Map());

  const pressed = ref(false);

  const lastRippleId = ref<RippleId>();

  const onPressDown = (element: Element, clientX: number, clientY: number) => {
    const { left, top, right, bottom } = element.getBoundingClientRect();
    const offsetX = clientX - left;
    const offsetY = clientY - top;

    const diameter =
      Math.max(
        Math.hypot(left - clientX, top - clientY),
        Math.hypot(right - clientX, top - clientY),
        Math.hypot(left - clientX, bottom - clientY),
        Math.hypot(right - clientX, bottom - clientY),
      ) * 2;

    pressed.value = true;

    const id = uniqueId('ripple');

    const options = reactive<RippleOptions>({
      state: 'enter',
      offsetX,
      offsetY,
      diameter,
    });

    rippleSet.set(id, options);

    lastRippleId.value = id;
  };

  const onPressUp = () => {
    pressed.value = false;
    rippleSet.forEach((opt) => {
      if (opt.state === 'default') {
        opt.state = 'leave';
      }
    });
  };

  const onAnimationend = (id: RippleId, animation: RippleAnimation) => {
    debug('onAnimationend', id, animation);

    if (animation === RippleAnimation.leave) {
      rippleSet.delete(id);
    }

    const rippleOptions = rippleSet.get(id);

    if (animation === RippleAnimation.enter && rippleOptions) {
      rippleOptions.state =
        pressed.value && lastRippleId.value === id ? 'default' : 'leave';
    }
  };

  return {
    onPressUp,
    onPressDown,
    onAnimationend,
    pressed,
    rippleSet,
  };
};
