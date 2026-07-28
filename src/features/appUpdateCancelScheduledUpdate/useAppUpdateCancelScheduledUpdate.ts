import { ref } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { cancelScheduledAppUpdate } from '@shared/serviceClient/appUpdate/client';

/**
 * User action (Manual mode): cancel an update scheduled for the next clean launch.
 * @returns The `cancelScheduledUpdate` action and its `isCancelling` in-flight flag.
 */
export function useAppUpdateCancelScheduledUpdate() {
  const { applySnapshot } = useAppUpdate();
  const isCancelling = ref(false);

  const cancelScheduledUpdate = async () => {
    if (isCancelling.value) return;
    isCancelling.value = true;
    try {
      applySnapshot(await cancelScheduledAppUpdate());
    } finally {
      isCancelling.value = false;
    }
  };

  return { cancelScheduledUpdate, isCancelling };
}
