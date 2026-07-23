import { useAppUpdate } from '@entity/appUpdate';
import { useSnackbar } from '@shared/ui/Snackbar';
import { watch } from 'vue';

const observedReleaseIds = new Set<string>();

/** Shows one transient notification per newly observed Manual-mode update in this session. */
export const useManualAppUpdateNotification = () => {
  const { addSnackbar } = useSnackbar();
  const { snapshot, hasUpdate } = useAppUpdate();
  watch(
    () => snapshot.value?.latestRelease?.releaseId,
    (releaseId) => {
      if (!releaseId || observedReleaseIds.has(releaseId)) return;
      const isFirstObservation = observedReleaseIds.size === 0;
      observedReleaseIds.add(releaseId);
      if (!isFirstObservation && snapshot.value?.mode === 'manual' && hasUpdate.value) {
        addSnackbar({ text: 'A new app version is available' });
      }
    },
    { immediate: true },
  );
};
