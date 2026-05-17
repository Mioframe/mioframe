import { useFileSystem } from '@entity/mountedDirectories';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { isFunction } from 'es-toolkit';
import { ref, toRef } from 'vue';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';
const CREATE_GUARDRAIL_HEADLINE = 'Choose a dedicated folder';
const CREATE_GUARDRAIL_TEXT =
  'This folder already contains other files. Create or select an empty folder for the new Mioframe space.';
const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT =
  'This folder does not contain Mioframe service files. Select an existing Mioframe space folder.';

const buildAddFolderError = () =>
  new DomainError('Could not open the Mioframe space', {
    cause: createSafeErrorCause('Mioframe space selection failed'),
  });

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * @returns Reactive dialog state and actions for the Mioframe space picker.
 */
export const usePickMioframeSpace = () => {
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

  const mountMioframeSpace = async (handle: FileSystemDirectoryHandle) => {
    await addDeviceDirectory(handle);
  };

  const runPicker = async () => {
    return await window.showDirectoryPicker({
      mode: 'readwrite',
    });
  };

  const handleUnexpectedPickerError = (error: unknown, action: string) => {
    const reportedError = error instanceof DomainError ? error : buildAddFolderError();

    addSnackbar({
      text: reportedError.message,
    });
    reportHandledError(reportedError, {
      feature: 'mioframeSpacePick',
      action,
    });
  };

  const withPicker = async (action: string, run: () => Promise<void>) => {
    if (loading.value) {
      return;
    }

    if (!isSupported.value) {
      showUnsupportedMessage();
      return;
    }

    loading.value = true;

    try {
      await run();
    } catch (error) {
      if (!isUserFileSelectionCancel(error)) {
        handleUnexpectedPickerError(error, action);
      }
    } finally {
      loading.value = false;
    }
  };

  const askToChooseAnotherFolder = async (headline: string, supportingText: string) =>
    await confirm({
      headline,
      supportingText,
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });

  const createSpace = async () => {
    const chooseCreateSpace = async (): Promise<void> => {
      const selectedHandle = await runPicker();
      const inspection = await inspectMioframeSpaceDirectory(selectedHandle);

      if (
        !inspection.looksRiskyByName &&
        !inspection.looksLargeAndOrdinary &&
        !inspection.looksLikeExistingSpace
      ) {
        await mountMioframeSpace(selectedHandle);
        return;
      }

      const shouldContinueChoosing = await askToChooseAnotherFolder(
        CREATE_GUARDRAIL_HEADLINE,
        CREATE_GUARDRAIL_TEXT,
      );

      if (shouldContinueChoosing) {
        await chooseCreateSpace();
      }
    };

    await withPicker('createSpace', async () => {
      await chooseCreateSpace();
    });
  };

  const openSpace = async () => {
    const chooseExistingSpace = async (): Promise<void> => {
      const selectedHandle = await runPicker();
      const inspection = await inspectMioframeSpaceDirectory(selectedHandle);

      if (inspection.looksLikeExistingSpace) {
        await mountMioframeSpace(selectedHandle);
        return;
      }

      const shouldContinueChoosing = await askToChooseAnotherFolder(
        OPEN_GUARDRAIL_HEADLINE,
        OPEN_GUARDRAIL_TEXT,
      );

      if (shouldContinueChoosing) {
        await chooseExistingSpace();
      }
    };

    await withPicker('openSpace', async () => {
      await chooseExistingSpace();
    });
  };

  return {
    isSupported,
    loading,
    createSpace,
    openSpace,
  };
};
