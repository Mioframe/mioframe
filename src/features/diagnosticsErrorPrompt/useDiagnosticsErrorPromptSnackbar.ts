import { watch } from 'vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDiagnosticsErrorPrompt } from './useDiagnosticsErrorPrompt';

/**
 * Wires the contextual diagnostics prompt into the existing Snackbar surface instead of a
 * competing overlay. Queues a snackbar after the gates in `useDiagnosticsErrorPrompt` allow it,
 * so it shows after (not on top of) the handled-error snackbar that requested it.
 */
export const useDiagnosticsErrorPromptSnackbar = () => {
  const { isVisible, enableDiagnostics, dismiss } = useDiagnosticsErrorPrompt();
  const { addSnackbar } = useSnackbar();

  watch(isVisible, (visible) => {
    if (!visible) {
      return;
    }

    const removeFromQueue = addSnackbar({
      text: 'Enable diagnostics to send technical error reports. Your documents and file names are not sent.',
      actionLabel: 'Enable diagnostics',
      callback: () => {
        enableDiagnostics();
        removeFromQueue();
      },
      onClose: dismiss,
    });
  });
};
