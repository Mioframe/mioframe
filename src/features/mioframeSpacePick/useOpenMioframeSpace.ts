import { useFileSystem } from '@entity/mountedDirectories';
import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { isFunction } from 'es-toolkit';
import { ref, toRef } from 'vue';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { buildOpenSpaceError } from './mioframeSpacePick.errors';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';
const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT = 'Choose a folder where a Mioframe space has already been created.';

export const useOpenMioframeSpace = () => {
  const loading = ref(false);
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const isSupported = toRef(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const showUnsupportedMessage = () => {
    addSnackbar({
      text: UNSUPPORTED_MESSAGE,
      actionLabel: 'More details',
      timeout: 5e3,
      callback: () => {
        window.open(
          'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
          '_blank',
        );
      },
    });
  };

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
      showUnsupportedMessage();
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
