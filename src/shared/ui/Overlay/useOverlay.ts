import { useOnEscapeKeyStacked } from '@shared/lib/useOnEscapeKeyStacked';
import { tryOnBeforeUnmount, type MaybeElement } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap.mjs';
import type { MaybeRef } from 'vue';
import { computed, nextTick, toValue, watch, type Ref } from 'vue';
import { useMonitorOpenDialog } from '../Dialog/Alert';
import { onBackNavigation } from '@shared/lib/onBackNavigation';

// FIXME: рефакторить в набор параметров для композиции оверлея

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
  showModel: Ref<boolean>,
  mode: MaybeRef<'overlay' | 'dialog'> = 'overlay',
) => {
  const { activate: lockFocus, deactivate: unlockFocus } = useFocusTrap(
    container,
    {
      allowOutsideClick: true,
    },
  );

  onBackNavigation(() => {
    if (showModel.value) {
      showModel.value = false;

      if (toValue(mode) === 'dialog') {
        return false;
      }
    }
    return true;
  });

  watch(
    [showModel, container],
    ([showModel, container]) => {
      if (toValue(mode) === 'dialog' && showModel && container) {
        void nextTick(() => {
          lockFocus();
        });
      } else {
        unlockFocus();
      }
    },
    { flush: 'post' },
  );

  const { dialogContainer } = useMonitorOpenDialog(
    computed(() => (toValue(mode) === 'dialog' ? showModel.value : false)),
  );

  useOnEscapeKeyStacked(() => {
    showModel.value = false;
  });

  tryOnBeforeUnmount(() => {
    unlockFocus();
  });

  return {
    dialogContainer,
  };
};
