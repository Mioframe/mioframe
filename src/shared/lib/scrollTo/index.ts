import { refAutoReset, tryOnScopeDispose, until, useEventListener } from '@vueuse/core';
import { delay, throttle } from 'es-toolkit';
import pLimit from 'p-limit';
import { nextTick, reactive, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue';

type ScrollTarget = {
  behavior?: ScrollBehavior | undefined;
  left?: number | undefined;
  top?: number | undefined;
};

/**
 * Tracks a scrollable element's position and exposes a `scrollTo` that resolves only once the
 * element has verifiably reached the requested position, retrying a superseded smooth scroll.
 * @param container - The scrollable element to observe and drive.
 * @param options - Throttle window for scroll-position sampling and settle detection.
 * @returns The current scroll position and a serialized `scrollTo`.
 */
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

    if (!el) {
      return;
    }

    const target: ScrollToOptions = { behavior };
    if (left !== undefined) {
      target.left = left;
    }
    if (top !== undefined) {
      target.top = top;
    }

    const reachedTarget = () =>
      (top === undefined || Math.abs(el.scrollTop - top) <= 1) &&
      (left === undefined || Math.abs(el.scrollLeft - left) <= 1);

    // "No recent scroll events" only proxies for "the browser reached the requested position":
    // a smooth scroll queued behind another one already in flight can be superseded before
    // arriving. Retry until the element actually reports the requested position.
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts && !reachedTarget(); attempt += 1) {
      el.scrollTo(target);

      // eslint-disable-next-line no-await-in-loop -- each retry must observe its own settle window before deciding whether another attempt is needed
      await delay(throttleMs);
      // eslint-disable-next-line no-await-in-loop -- see above
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
