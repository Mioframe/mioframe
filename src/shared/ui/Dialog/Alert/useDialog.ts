import { sessionUniqueId } from '@shared/lib/uniqueId';
import type { MaybeElementRef } from '@vueuse/core';
import { createGlobalState, tryOnScopeDispose, unrefElement } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import type { Ref } from 'vue';
import { computed, reactive, ref, shallowRef, watch, watchEffect } from 'vue';

type AlertDescription = {
  type: 'alert' | 'confirm';
  headline: string;
  supportingText: string;
  id: string;
  confirmLabel?: string | undefined;
  symbolName?: string | undefined;
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
  ) =>
    await new Promise<boolean>((resolve) => {
      const id = sessionUniqueId('dialog');

      const callback = (result: boolean) => {
        alertSet.delete(alertDescription);
        resolve(result);
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
    });

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

  const globalDialogContainer = shallowRef<HTMLElement | SVGElement | null | undefined>();

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

  let isCountedOpen = false;

  watch(
    open,
    (isOpen, previousOpen) => {
      if (isOpen && !isCountedOpen) {
        numberOfOpenDialogs.value += 1;
        isCountedOpen = true;
      } else if (!isOpen && !isUndefined(previousOpen) && isCountedOpen) {
        numberOfOpenDialogs.value -= 1;
        isCountedOpen = false;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  tryOnScopeDispose(() => {
    if (isCountedOpen) {
      numberOfOpenDialogs.value -= 1;
      isCountedOpen = false;
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
