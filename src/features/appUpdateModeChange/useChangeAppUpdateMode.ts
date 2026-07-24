import {
  appUpdateClient,
  type AppUpdateActionResult,
  type AppUpdateMode,
} from '@shared/serviceClient/appUpdate';
import { readonly, ref } from 'vue';

/**
 * Provides the managed-update mode-change action without exposing entity or controller state.
 * @returns Local pending/result refs and the narrow mode action.
 */
export const useChangeAppUpdateMode = () => {
  const pending = ref(false);
  const result = ref<AppUpdateActionResult>();
  const setMode = async (mode: AppUpdateMode) => {
    pending.value = true;
    try {
      result.value = await appUpdateClient.setMode(mode);
      return result.value;
    } finally {
      pending.value = false;
    }
  };
  return { pending: readonly(pending), result: readonly(result), setMode };
};
