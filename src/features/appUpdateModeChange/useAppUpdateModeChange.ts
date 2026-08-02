import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { setAppUpdateMode, type UpdateMode } from '@shared/serviceClient/appUpdate/client';

/**
 * User action: switch between Automatic and Manual update modes.
 * @returns The action, its finite in-flight flag, and its latest transport outcome.
 */
export function useAppUpdateModeChange() {
  const { applyClientResult } = useAppUpdate();
  const isChangingMode = ref(false);
  const outcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();

  const setMode = async (mode: UpdateMode) => {
    if (isChangingMode.value) return;
    outcome.value = undefined;
    isChangingMode.value = true;
    try {
      const result = await setAppUpdateMode(mode);
      applyClientResult(result);
      outcome.value = result.status;
    } finally {
      isChangingMode.value = false;
    }
  };

  return { setMode, isChangingMode, outcome };
}
