import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { setAppUpdateMode, type UpdateMode } from '@shared/serviceClient/appUpdate/client';

/**
 * User action: switch between Automatic and Manual update modes.
 * @returns The `setMode` action and its `isChangingMode` in-flight flag.
 */
export function useAppUpdateModeChange() {
  const { applySnapshot } = useAppUpdate();
  const isChangingMode = ref(false);

  const setMode = async (mode: UpdateMode) => {
    if (isChangingMode.value) return;
    isChangingMode.value = true;
    try {
      applySnapshot(await setAppUpdateMode(mode));
    } finally {
      isChangingMode.value = false;
    }
  };

  return { setMode, isChangingMode };
}
