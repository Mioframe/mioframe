import { useAppUpdate } from '@entity/appUpdate';
import { useSnackbar } from '@shared/ui/Snackbar';
import { watch } from 'vue';

/** Shows one transient notification per newly confirmed Manual-mode version. */
export const useManualAppUpdateNotification = () => {
  const { addSnackbar } = useSnackbar();
  const { hasUpdate, latestRelease, state } = useAppUpdate();
  let notifiedReleaseId: string | undefined;
  let initialized = false;

  watch(
    [hasUpdate, latestRelease, state],
    ([available, latest, current]) => {
      if (!current) return;
      if (!initialized) {
        initialized = true;
        notifiedReleaseId = latest?.releaseId;
        return;
      }
      if (
        current.mode === 'manual' &&
        available &&
        latest &&
        latest.releaseId !== notifiedReleaseId
      ) {
        notifiedReleaseId = latest.releaseId;
        addSnackbar({ text: 'A new app version is available' });
      }
    },
    { immediate: true },
  );
};
