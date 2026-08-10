import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { cancelScheduledAppUpdate } from '@shared/serviceClient/appUpdate/client';

/**
 * User action (Manual mode): cancel an update scheduled for the next clean launch.
 * @returns The action, its finite in-flight flag, and its latest transport outcome.
 */
export function useAppUpdateCancelScheduledUpdate() {
  const { applyClientResult } = useAppUpdate();
  const isCancelling = ref(false);
  const outcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();

  const cancelScheduledUpdate = async () => {
    if (isCancelling.value) return;
    outcome.value = undefined;
    isCancelling.value = true;
    try {
      const result = await cancelScheduledAppUpdate();
      applyClientResult(result);
      outcome.value = result.status;
    } finally {
      isCancelling.value = false;
    }
  };

  return { cancelScheduledUpdate, isCancelling, outcome };
}
