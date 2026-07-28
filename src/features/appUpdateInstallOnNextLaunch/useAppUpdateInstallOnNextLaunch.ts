import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { installAppUpdateOnNextLaunch } from '@shared/serviceClient/appUpdate/client';

/**
 * User action (Manual mode): schedule the current latest release for installation on the next clean launch.
 * @returns The `installOnNextLaunch` action and its `isInstalling` in-flight flag.
 */
export function useAppUpdateInstallOnNextLaunch() {
  const { applySnapshot } = useAppUpdate();
  const isInstalling = ref(false);

  const installOnNextLaunch = async () => {
    if (isInstalling.value) return;
    isInstalling.value = true;
    try {
      applySnapshot(await installAppUpdateOnNextLaunch());
    } finally {
      isInstalling.value = false;
    }
  };

  return { installOnNextLaunch, isInstalling };
}
