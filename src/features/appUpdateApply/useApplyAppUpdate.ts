import { appUpdateClient, type AppUpdateActionResult } from '@shared/serviceClient/appUpdate';
import { readonly, ref } from 'vue';

/**
 * Provides the explicit apply-update action and its immediate acknowledgement result.
 * @returns Local pending/result refs and the narrow update action.
 */
export const useApplyAppUpdate = () => {
  const pending = ref(false);
  const result = ref<AppUpdateActionResult>();
  const updateNow = async () => {
    pending.value = true;
    try {
      result.value = await appUpdateClient.updateNow();
      return result.value;
    } finally {
      pending.value = false;
    }
  };
  return { pending: readonly(pending), result: readonly(result), updateNow };
};
