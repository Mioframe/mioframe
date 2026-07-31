import { watch } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { useSnackbar } from '@shared/ui/Snackbar';

/**
 * Release numbers already notified during this application session (a plain
 * in-memory module set, cleared on a full reload — never persisted in
 * IndexedDB, controller state, local settings, or Cache Storage). Shared by
 * every `useAppUpdateNotify` call in this session, so the notification
 * cannot repeat merely because a consuming composable is set up more than
 * once.
 */
const notifiedReleaseNumbersThisSession = new Set<number>();

/**
 * User-facing notification: shows one short Snackbar per application
 * session when Manual mode has an `available` candidate that has not
 * already been notified this session. Never shown in Automatic mode, and
 * never shown for `ready`, `activating`, or `failed` — only the `available`
 * phase offers something new to schedule. A strictly newer release number
 * may notify again within the same session; the same release number never
 * repeats.
 *
 * Never imports page navigation: the caller (an app-level composition root)
 * injects `onView` and owns opening the App updates pane.
 * @param onView - Called when the user selects the Snackbar's `View` action.
 */
export function useAppUpdateNotify(onView: () => void): void {
  const { mode, candidate } = useAppUpdate();
  const { addSnackbar } = useSnackbar();

  watch(
    [mode, candidate],
    ([currentMode, currentCandidate]) => {
      if (currentMode !== 'manual') return;
      if (currentCandidate?.phase !== 'available') return;
      const { releaseNumber } = currentCandidate.release;
      if (notifiedReleaseNumbersThisSession.has(releaseNumber)) return;

      notifiedReleaseNumbersThisSession.add(releaseNumber);
      addSnackbar({
        text: 'Mioframe update available',
        timeout: 7000,
        actionLabel: 'View',
        callback: onView,
      });
    },
    { immediate: true },
  );
}
