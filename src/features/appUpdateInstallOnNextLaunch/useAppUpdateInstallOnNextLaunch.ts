import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { installAppUpdateOnNextLaunch } from '@shared/serviceClient/appUpdate/client';

/**
 * User action (Manual mode): schedule the current latest release for installation on the next clean launch.
 * @returns The action, its finite in-flight flag, and its latest transport outcome.
 */
export function useAppUpdateInstallOnNextLaunch() {
  const { applyClientResult } = useAppUpdate();
  const isInstalling = ref(false);
  const outcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();

  const installOnNextLaunch = async () => {
    if (isInstalling.value) return;
    outcome.value = undefined;
    isInstalling.value = true;
    try {
      const result = await installAppUpdateOnNextLaunch();
      applyClientResult(result);
      outcome.value = result.status;
    } finally {
      isInstalling.value = false;
    }
  };

  return { installOnNextLaunch, isInstalling, outcome };
}
