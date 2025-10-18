import {
  refAutoReset,
  tryOnScopeDispose,
  until,
  useEventListener,
} from '@vueuse/core';
import { delay, throttle } from 'es-toolkit';
import pLimit from 'p-limit';
import {
  nextTick,
  reactive,
  readonly,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from 'vue';

export const useScroll = (
  container: MaybeRefOrGetter<HTMLElement | undefined | null>,
  { throttleMs = 1e3 / 10 }: { throttleMs?: number } = {},
) => {
  const scrollTop = ref<number>();
  const scrollLeft = ref<number>();

  const scrollActive = refAutoReset(false, throttleMs * 2);

  const scrollHandler = () => {
    scrollActive.value = true;
    const el = toValue(container);
    if (el) {
      scrollTop.value = el.scrollTop;
      scrollLeft.value = el.scrollLeft;
    } else {
      scrollTop.value = undefined;
      scrollLeft.value = undefined;
    }
  };

  useEventListener(container, 'scroll', throttle(scrollHandler, throttleMs));

  const scrollTo = async ({
    behavior = 'smooth',
    left,
    top,
  }: ScrollToOptions) => {
    const el = toValue(container);

    if (el) {
      el.scrollTo({ behavior, left, top });

      await delay(throttleMs);

      await until(scrollActive).toBe(false, { timeout: 10e3 });
    }
  };

  const limit = pLimit(1);

  const limitScrollTo = async ({
    behavior = 'smooth',
    left,
    top,
  }: ScrollToOptions) => {
    await limit(async () => {
      await nextTick();

      await scrollTo({ behavior, left, top });
    });
  };

  tryOnScopeDispose(() => {
    scrollActive.value = false;
    limit.clearQueue();
  });

  return {
    scrollTo: limitScrollTo,
    position: readonly(
      reactive({
        scrollTop,
        scrollLeft,
      }),
    ),
  };
};
