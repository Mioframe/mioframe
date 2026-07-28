import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { checkForAppUpdates } from '@shared/serviceClient/appUpdate/client';

/**
 * User action: check for a newer application release.
 * @returns The `checkForUpdates` action and its `isChecking` in-flight flag.
 */
export function useAppUpdateCheck() {
  const { applySnapshot } = useAppUpdate();
  const isChecking = ref(false);

  const checkForUpdates = async () => {
    if (isChecking.value) return;
    isChecking.value = true;
    try {
      applySnapshot(await checkForAppUpdates());
    } finally {
      isChecking.value = false;
    }
  };

  return { checkForUpdates, isChecking };
}
