import { useOnEscapeKeyStacked } from '@shared/lib/useOnEscapeKeyStacked';
import { useOverlayNavigation } from '@shared/lib/useOverlayNavigation';
import {
  tryOnBeforeUnmount,
  tryOnScopeDispose,
  type MaybeElement,
} from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap.mjs';
import type { MaybeRef } from 'vue';
import { computed, nextTick, toValue, watch, type Ref } from 'vue';
import { useMonitorOpenDialog } from '../Dialog/Alert';
import { toString } from 'es-toolkit/compat';

const uniqueLabelSet = new Set<string>();

/**
 * Добавляет оверлею навигацию, закрытие по Escape и фокус-трап.
 * @param container - контейнер, в котором нужно зафиксировать фокус
 * @param uniqueLabel - уникальная строка, которая используется для идентификации оверлея в стеке навигации
 * @param showModel - реактивная переменная, управляющая видимостью оверлея
 * @throws Ошибка, если uniqueLabel не уникален
 * @returns Объект с реактивной переменной showOverlay, управляющей видимостью оверлея
 */
export const useOverlay = (
  container: Ref<MaybeElement>,
  uniqueLabel: Ref<string | number>,
  showModel: Ref<boolean>,
  mode: MaybeRef<'overlay' | 'dialog'> = 'overlay',
) => {
  const lowercasedLabel = computed(() =>
    toString(uniqueLabel.value).trim().toLowerCase(),
  );

  watch(
    lowercasedLabel,
    (lowercasedLabel, old) => {
      if (old) {
        uniqueLabelSet.delete(old);
      }
      if (uniqueLabelSet.has(lowercasedLabel)) {
        console.warn(
          `useOverlay: uniqueLabel "${lowercasedLabel}" is not unique! It must be unique for each overlay/dialog on the page.`,
        );
      }
      uniqueLabelSet.add(lowercasedLabel);
    },
    { immediate: true },
  );

  const { activate: lockFocus, deactivate: unlockFocus } = useFocusTrap(
    container,
    {
      allowOutsideClick: true,
    },
  );

  const { show: showOverlay } = useOverlayNavigation(lowercasedLabel);

  watch(
    [showOverlay, container],
    ([showOverlay, container]) => {
      if (toValue(mode) === 'dialog' && showOverlay && container) {
        void nextTick(() => {
          lockFocus();
        });
      } else {
        unlockFocus();
      }
    },
    { flush: 'post' },
  );

  const showOverlayWatchHandle = watch(showOverlay, (showOverlay) => {
    showWatchHandle.pause();
    showModel.value = showOverlay;
    void nextTick(showWatchHandle.resume);
  });

  const showWatchHandle = watch(
    showModel,
    (show) => {
      showOverlayWatchHandle.pause();
      showOverlay.value = show;
      void nextTick(showOverlayWatchHandle.resume);
    },
    { immediate: true },
  );

  const { dialogContainer } = useMonitorOpenDialog(
    computed(() => (toValue(mode) === 'dialog' ? showOverlay.value : false)),
  );

  useOnEscapeKeyStacked(() => {
    showOverlay.value = false;
  });

  tryOnBeforeUnmount(() => {
    unlockFocus();
  });

  tryOnScopeDispose(() => {
    uniqueLabelSet.delete(lowercasedLabel.value);
  });

  return {
    showOverlay,
    dialogContainer,
  };
};
