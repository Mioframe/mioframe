import { uniqueId } from '@shared/lib/uniqueId';
import { createGlobalState, until } from '@vueuse/core';
import { isBoolean } from 'remeda';
import { nextTick, reactive, ref } from 'vue';

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

  return {
    alert,
    confirm,
    alertSet,
  };
});

export const useDialog = () => {
  const { alert, confirm } = useDialogState();
  return {
    alert,
    confirm,
  };
};
