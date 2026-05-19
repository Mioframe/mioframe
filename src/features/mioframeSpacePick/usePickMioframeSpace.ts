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
const CREATE_CONFIRM_HEADLINE = 'Create Mioframe space here?';
const CREATE_RISKY_FOLDER_TEXT =
  'This is a common system folder. Mioframe files will be stored directly in the selected folder.';
const CREATE_NON_EMPTY_FOLDER_TEXT =
  'This folder already contains files. Mioframe files will be stored directly in the selected folder.';
const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT =
  'The selected folder is not a Mioframe space because the current Mioframe space marker file was not found.';
const EXISTING_SPACE_HEADLINE = 'Open existing Mioframe space?';
const EXISTING_SPACE_TEXT =
  'This folder already contains the current Mioframe space marker file. Open that space instead of creating a new one.';

const buildAddFolderError = (message: string, causeMessage: string) =>
  new DomainError(message, {
    cause: createSafeErrorCause(causeMessage),
  });

const buildCreateSpaceError = () =>
  buildAddFolderError('Could not create the Mioframe space', 'Creating the Mioframe space failed');

const buildOpenSpaceError = () =>
  buildAddFolderError('Could not open the Mioframe space', 'Opening the Mioframe space failed');

const wrapUnexpectedInspectionError = (action: 'createSpace' | 'openSpace'): DomainError =>
  action === 'createSpace' ? buildCreateSpaceError() : buildOpenSpaceError();

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * @returns Reactive dialog state and actions for the Mioframe space picker.
 */
export const usePickMioframeSpace = () => {
  const loading = ref(false);
  const { alert, confirm } = useDialog();
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

  const handleUnexpectedPickerError = (error: unknown, action: 'createSpace' | 'openSpace') => {
    const fallbackError =
      action === 'createSpace' ? buildCreateSpaceError() : buildOpenSpaceError();
    const reportedError = error instanceof DomainError ? error : fallbackError;

    addSnackbar({
      text: reportedError.message,
    });
    reportHandledError(reportedError, {
      feature: 'mioframeSpacePick',
      action,
    });
  };

  const withPicker = async (action: 'createSpace' | 'openSpace', run: () => Promise<void>) => {
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

  const explainWhyOpenCannotContinue = async () =>
    await alert({
      headline: OPEN_GUARDRAIL_HEADLINE,
      supportingText: OPEN_GUARDRAIL_TEXT,
      confirmLabel: 'OK',
    });

  const askWhereToCreateSpace = async (supportingText: string) =>
    await confirm({
      headline: CREATE_CONFIRM_HEADLINE,
      supportingText,
      confirmLabel: 'Create here',
      cancelLabel: 'Cancel',
    });

  const askToOpenExistingSpace = async () =>
    await confirm({
      headline: EXISTING_SPACE_HEADLINE,
      supportingText: EXISTING_SPACE_TEXT,
      confirmLabel: 'Open space',
      cancelLabel: 'Cancel',
    });

  const createSpace = async () => {
    await withPicker('createSpace', async () => {
      const selectedHandle = await runPicker();
      let inspection;

      try {
        inspection = await inspectMioframeSpaceDirectory(selectedHandle);
      } catch {
        throw wrapUnexpectedInspectionError('createSpace');
      }

      if (inspection.looksLikeExistingSpace) {
        if (await askToOpenExistingSpace()) {
          await mountMioframeSpace(selectedHandle);
        }
        return;
      }

      if (!inspection.looksRiskyByName && inspection.isEmpty) {
        await mountMioframeSpace(selectedHandle);
        return;
      }

      const createConfirmationText = inspection.looksRiskyByName
        ? CREATE_RISKY_FOLDER_TEXT
        : CREATE_NON_EMPTY_FOLDER_TEXT;

      if (await askWhereToCreateSpace(createConfirmationText)) {
        await mountMioframeSpace(selectedHandle);
      }
    });
  };

  const openSpace = async () => {
    await withPicker('openSpace', async () => {
      const selectedHandle = await runPicker();
      let inspection;

      try {
        inspection = await inspectMioframeSpaceDirectory(selectedHandle);
      } catch {
        throw wrapUnexpectedInspectionError('openSpace');
      }

      if (inspection.looksLikeExistingSpace) {
        await mountMioframeSpace(selectedHandle);
        return;
      }

      await explainWhyOpenCannotContinue();
    });
  };

  return {
    isSupported,
    loading,
    createSpace,
    openSpace,
  };
};
