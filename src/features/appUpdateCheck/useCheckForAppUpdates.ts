import { appUpdateClient, type AppUpdateActionResult } from '@shared/serviceClient/appUpdate';
import { readonly, ref } from 'vue';

/**
 * Provides the explicit check-for-updates user action and its immediate result.
 * @returns Local pending/result refs and the narrow check action.
 */
export const useCheckForAppUpdates = () => {
  const pending = ref(false);
  const result = ref<AppUpdateActionResult>();
  const checkForUpdates = async () => {
    pending.value = true;
    try {
      result.value = await appUpdateClient.checkForUpdates();
      return result.value;
    } finally {
      pending.value = false;
    }
  };
  return { pending: readonly(pending), result: readonly(result), checkForUpdates };
};
