import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { checkForAppUpdates } from '@shared/serviceClient/appUpdate/client';

/**
 * User action: check for a newer application release.
 * @returns The action, its finite in-flight flag, and its latest transport outcome.
 */
export function useAppUpdateCheck() {
  const { applyClientResult } = useAppUpdate();
  const isChecking = ref(false);
  const outcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();

  const checkForUpdates = async () => {
    if (isChecking.value) return;
    outcome.value = undefined;
    isChecking.value = true;
    try {
      const result = await checkForAppUpdates();
      applyClientResult(result);
      outcome.value = result.status;
    } finally {
      isChecking.value = false;
    }
  };

  return { checkForUpdates, isChecking, outcome };
}
