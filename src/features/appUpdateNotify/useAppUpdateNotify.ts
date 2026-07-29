import { watch } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { useSnackbar } from '@shared/ui/Snackbar';

/**
 * Release ids already notified during this application session (a plain
 * in-memory module set, cleared on a full reload — never persisted in
 * IndexedDB, controller state, local settings, or Cache Storage). Shared by
 * every `useAppUpdateNotify` call in this session, so the notification
 * cannot repeat merely because a consuming composable is set up more than
 * once.
 */
const notifiedReleaseIdsThisSession = new Set<string>();

/**
 * User-facing notification: shows one short Snackbar per application
 * session when Manual mode discovers a newer release that has not yet been
 * scheduled and has not already been notified this session. Never shown in
 * Automatic mode. A strictly newer release id may notify again within the
 * same session; the same release id never repeats.
 *
 * Never imports page navigation: the caller (an app-level composition root)
 * injects `onView` and owns opening the App updates pane.
 * @param onView - Called when the user selects the Snackbar's `View` action.
 */
export function useAppUpdateNotify(onView: () => void): void {
  const { mode, activeRelease, latestRelease, scheduledRelease } = useAppUpdate();
  const { addSnackbar } = useSnackbar();

  watch(
    [mode, activeRelease, latestRelease, scheduledRelease],
    ([currentMode, active, latest, scheduled]) => {
      if (currentMode !== 'manual') return;
      if (!active || !latest || latest.releaseId === active.releaseId) return;
      if (scheduled) return;
      if (notifiedReleaseIdsThisSession.has(latest.releaseId)) return;

      notifiedReleaseIdsThisSession.add(latest.releaseId);
      addSnackbar({
        text: 'Mioframe update available',
        actionLabel: 'View',
        callback: onView,
      });
    },
    { immediate: true },
  );
}
