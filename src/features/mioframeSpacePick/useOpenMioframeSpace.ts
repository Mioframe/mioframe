import { useFileSystem } from '@entity/mountedDirectories';
import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ref, toRef } from 'vue';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import {
  isDirectoryPickerSupported,
  showDirectoryPickerUnsupportedMessage,
} from './directoryPickerSupport';
import { buildOpenSpaceError } from './mioframeSpacePick.errors';

const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT = 'Choose a folder where a Mioframe space has already been created.';

/**
 * Exposes the open-existing-space flow for Mioframe directories selected through the browser picker.
 * @returns Reactive picker support, loading state, and the open action for existing Mioframe spaces.
 */
export const useOpenMioframeSpace = () => {
  const loading = ref(false);
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const isSupported = toRef(isDirectoryPickerSupported);

  const handleUnexpectedError = (error: unknown) => {
    const reportedError = error instanceof DomainError ? error : buildOpenSpaceError();

    addSnackbar({
      text: reportedError.message,
    });
    reportHandledError(reportedError, {
      feature: 'mioframeSpaceOpen',
      action: 'openSpace',
    });
  };

  const runPicker = async () =>
    await window.showDirectoryPicker({
      mode: 'readwrite',
    });

  const askToRetryOpenSpace = async () =>
    await confirm({
      headline: OPEN_GUARDRAIL_HEADLINE,
      supportingText: OPEN_GUARDRAIL_TEXT,
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });

  const pickExistingMioframeSpace = async () => {
    /* eslint-disable no-await-in-loop -- The retry flow is intentionally sequential: pick, inspect, confirm, then optionally pick again. */
    for (;;) {
      const selectedHandle = await runPicker();
      let inspection;

      try {
        inspection = await inspectMioframeSpaceDirectory(selectedHandle);
      } catch {
        throw buildOpenSpaceError();
      }

      if (inspection.looksLikeExistingSpace) {
        return selectedHandle;
      }

      if (!(await askToRetryOpenSpace())) {
        return;
      }
    }
    /* eslint-enable no-await-in-loop -- The retry flow is intentionally sequential: pick, inspect, confirm, then optionally pick again. */
  };

  const openSpace = async () => {
    if (loading.value) {
      return;
    }

    if (!isSupported.value) {
      showDirectoryPickerUnsupportedMessage(addSnackbar);
      return;
    }

    loading.value = true;

    try {
      const selectedHandle = await pickExistingMioframeSpace();

      if (!selectedHandle) {
        return;
      }

      await addDeviceDirectory(selectedHandle);
    } catch (error) {
      if (!isUserFileSelectionCancel(error)) {
        handleUnexpectedError(error);
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    isSupported,
    loading,
    openSpace,
  };
};
