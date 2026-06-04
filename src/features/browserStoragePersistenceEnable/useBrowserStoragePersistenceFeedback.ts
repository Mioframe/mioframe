import type { BrowserStoragePersistenceRequestOutcome } from '@entity/browserStoragePersistence';
import { useSnackbar } from '@shared/ui/Snackbar';

/** Shows a snackbar for the given requestPersistence() outcome. No-ops for 'ignored'. */
export const useBrowserStoragePersistenceFeedback = () => {
  const { addSnackbar } = useSnackbar();

  const showFeedback = (outcome: BrowserStoragePersistenceRequestOutcome) => {
    if (outcome === 'enabled') {
      addSnackbar({ text: 'More reliable browser storage enabled.' });
    } else if (outcome === 'not-enabled') {
      addSnackbar({
        text: 'The browser did not enable more reliable storage. You can continue using standard browser storage, but keep backups.',
      });
    } else if (outcome === 'failed') {
      addSnackbar({
        text: 'More reliable storage could not be enabled in this browser. You can continue using standard browser storage, but keep backups.',
      });
    } else if (outcome === 'unsupported') {
      addSnackbar({ text: 'More reliable storage is unavailable in this browser.' });
    }
    // 'ignored' → no feedback
  };

  return { showFeedback };
};
