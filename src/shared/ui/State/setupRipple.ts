import { uniqueId, type UniqueId } from '@shared/lib/uniqueId';
import type { MaybeRef } from 'vue';
import { computed, reactive, ref, toValue } from 'vue';
import { RippleAnimation } from './types';

export const setupRipple = (enable?: MaybeRef<boolean>) => {
  const enableRef = computed(() => toValue(enable));

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
    pressed.value = true;

    if (enableRef.value) {
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

      const id = uniqueId('ripple');

      const options = reactive<RippleOptions>({
        state: 'enter',
        offsetX,
        offsetY,
        diameter,
      });

      rippleSet.set(id, options);

      lastRippleId.value = id;
    }
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
