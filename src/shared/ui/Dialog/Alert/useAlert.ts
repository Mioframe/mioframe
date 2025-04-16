import { createGlobalState, until } from '@vueuse/core';
import { uniqueId } from 'lodash-es';
import { nextTick, reactive } from 'vue';

type AlertDescription = {
  headline: string;
  supportingText: string;
  id: string;
};

export const useAlertState = createGlobalState(() => {
  const alertSet = reactive(new Set<AlertDescription>());

  const alert = async (headline: string, supportingText: string) => {
    const alertDescription: AlertDescription = {
      id: uniqueId('alert'),
      headline,
      supportingText,
    };
    alertSet.add(alertDescription);
    await nextTick();
    await until(() => !alertSet.has(alertDescription)).toBe(true);
  };

  const onApply = (alertDescription: AlertDescription) => {
    alertSet.delete(alertDescription);
  };

  return {
    alert,
    onApply,
    alertSet,
  };
});

export const useAlert = () => {
  const { alert } = useAlertState();
  return {
    alert,
  };
};
