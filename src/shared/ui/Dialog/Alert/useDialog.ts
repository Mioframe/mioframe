import { uniqueId } from '@shared/lib/uniqueId';
import type { MaybeElementRef } from '@vueuse/core';
import {
  createGlobalState,
  tryOnScopeDispose,
  unrefElement,
  until,
} from '@vueuse/core';
import { isBoolean, isUndefined } from 'es-toolkit';
import type { Ref } from 'vue';
import {
  computed,
  nextTick,
  reactive,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from 'vue';

type AlertDescription = {
  type: 'alert' | 'confirm';
  headline: string;
  supportingText: string;
  id: string;
  confirmLabel?: string;
  symbolName?: string;
  callback: (result: boolean) => void;
};

export const useDialogState = createGlobalState(() => {
  const alertSet = reactive(new Set<AlertDescription>());

  const addDialog = async (
    type: 'alert' | 'confirm',
    headline: string,
    supportingText: string,
    confirmLabel?: string,
    symbolName?: string,
  ) => {
    const id = uniqueId('dialog');

    const resultState = ref<boolean>();

    const callback = (result: boolean) => {
      alertSet.delete(alertDescription);
      resultState.value = result;
    };

    const alertDescription: AlertDescription = {
      type,
      id,
      headline,
      supportingText,
      confirmLabel,
      callback,
      symbolName,
    };

    alertSet.add(alertDescription);

    await nextTick();

    await until(() => isBoolean(resultState.value)).toBe(true);

    // eslint-disable-next-line vue/no-ref-object-reactivity-loss -- it's ok
    return resultState.value;
  };

  const confirm = (
    headline: string,
    supportingText: string,
    confirmLabel?: string,
    symbolName?: string,
  ) => addDialog('confirm', headline, supportingText, confirmLabel, symbolName);

  const alert = (
    headline: string,
    supportingText: string,
    confirmLabel?: string,
    symbolName?: string,
  ) => addDialog('alert', headline, supportingText, confirmLabel, symbolName);

  const numberOfOpenDialogs = ref(0);

  const globalDialogContainer = shallowRef<
    HTMLElement | SVGElement | null | undefined
  >();

  return {
    alert,
    confirm,
    alertSet,
    numberOfOpenDialogs,
    globalDialogContainer,
  };
});

export const useDialog = () => {
  const { alert, confirm } = useDialogState();
  return {
    alert,
    confirm,
  };
};

export const useMonitorOpenDialog = (open: Ref<boolean>) => {
  const { numberOfOpenDialogs, globalDialogContainer } = useDialogState();

  watch(
    open,
    (open, old) => {
      if (!isUndefined(old)) {
        if (open) {
          numberOfOpenDialogs.value += 1;
        } else {
          numberOfOpenDialogs.value -= 1;
        }
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    if (open.value) {
      numberOfOpenDialogs.value -= 1;
    }
  });

  return {
    dialogContainer: globalDialogContainer,
  };
};

export const useDialogContainer = (dialogContainer: MaybeElementRef) => {
  const { numberOfOpenDialogs, globalDialogContainer } = useDialogState();

  watchEffect(() => {
    globalDialogContainer.value = unrefElement(dialogContainer);
  });

  return { hasOpenedDialog: computed(() => numberOfOpenDialogs.value > 0) };
};
