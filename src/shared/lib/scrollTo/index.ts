import { refAutoReset, tryOnScopeDispose, until, useEventListener } from '@vueuse/core';
import { delay, throttle } from 'es-toolkit';
import pLimit from 'p-limit';
import { nextTick, reactive, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue';

type ScrollTarget = {
  behavior?: ScrollBehavior | undefined;
  left?: number | undefined;
  top?: number | undefined;
};

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

  const scrollTo = async ({ behavior = 'smooth', left, top }: ScrollTarget) => {
    const el = toValue(container);

    if (el) {
      const target: ScrollToOptions = { behavior };
      if (left !== undefined) {
        target.left = left;
      }
      if (top !== undefined) {
        target.top = top;
      }

      el.scrollTo(target);

      await delay(throttleMs);

      await until(scrollActive).toBe(false, { timeout: 10e3 });
    }
  };

  const limit = pLimit(1);

  const limitScrollTo = async ({ behavior = 'smooth', left, top }: ScrollTarget) => {
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
