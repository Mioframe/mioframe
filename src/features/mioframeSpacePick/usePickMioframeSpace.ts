import { useFileSystem } from '@entity/mountedDirectories';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { isFunction } from 'es-toolkit';
import { ref, toRef } from 'vue';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import {
  createMioframeSubfolder,
  inspectMioframeSpaceDirectory,
  MIOFRAME_SPACE_FOLDER_NAME,
  type MioframeSpaceInspection,
} from './mioframeSpacePick.helpers';

type EntryDialogState = {
  kind: 'entry';
};

type CreateDialogState = {
  kind: 'create';
};

type ConfirmDialogState = {
  kind: 'confirmUseFolder';
  handle: FileSystemDirectoryHandle;
  headline: string;
  supportingText: string;
  confirmLabel: string;
};

type WarningDialogState = {
  kind: 'warning';
  handle: FileSystemDirectoryHandle;
  headline: string;
  supportingText: string;
};

/** Reactive dialog states used by the Mioframe space picker flow. */
export type MioframeSpaceDialogState =
  | EntryDialogState
  | CreateDialogState
  | ConfirmDialogState
  | WarningDialogState;

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';

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
  const dialogState = ref<MioframeSpaceDialogState>();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const isSupported = toRef(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const closeDialog = () => {
    if (loading.value) {
      return;
    }

    dialogState.value = undefined;
  };

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
    dialogState.value = undefined;
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

  const showUseFolderWarning = (
    handle: FileSystemDirectoryHandle,
    folderName: string,
  ): WarningDialogState => ({
    kind: 'warning',
    handle,
    headline: `Use the whole ${folderName} folder?`,
    supportingText:
      'Mioframe will store documents and service files directly in this folder. In a common folder, this may look like many technical files.\n\nIt is better to create a dedicated folder for the Mioframe space.',
  });

  const showUseFolderConfirmation = (
    handle: FileSystemDirectoryHandle,
    inspection: MioframeSpaceInspection,
  ): ConfirmDialogState => ({
    kind: 'confirmUseFolder',
    handle,
    headline: 'Use this folder as a Mioframe space?',
    supportingText: inspection.isEmpty
      ? 'This folder is empty. Mioframe will store documents and service files inside it.'
      : 'This folder does not look like an existing Mioframe space. Mioframe will store documents and service files inside it.',
    confirmLabel: 'Use this folder',
  });

  const evaluatePickedFolder = async (
    handle: FileSystemDirectoryHandle,
    {
      allowCreateSubfolder,
    }: {
      allowCreateSubfolder: boolean;
    },
  ) => {
    const inspection = await inspectMioframeSpaceDirectory(handle);

    if (inspection.looksLikeExistingSpace) {
      await mountMioframeSpace(handle);
      return;
    }

    if (inspection.looksRiskyByName || inspection.looksLargeAndOrdinary) {
      dialogState.value = showUseFolderWarning(handle, handle.name);
      return;
    }

    if (allowCreateSubfolder && handle.name !== MIOFRAME_SPACE_FOLDER_NAME) {
      dialogState.value = showUseFolderConfirmation(handle, inspection);
      return;
    }

    dialogState.value = showUseFolderConfirmation(handle, inspection);
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

  const openMioframeSpaceDialog = () => {
    if (loading.value) {
      return;
    }

    if (!isSupported.value) {
      showUnsupportedMessage();
      return;
    }

    dialogState.value = { kind: 'entry' };
  };

  const openCreateDialog = () => {
    dialogState.value = { kind: 'create' };
  };

  const createNewSpace = async () => {
    await withPicker('createNewSpace', async () => {
      const parentHandle = await runPicker();
      const mioframeHandle = await createMioframeSubfolder(parentHandle);
      await mountMioframeSpace(mioframeHandle);
    });
  };

  const chooseAnotherLocation = async () => {
    await withPicker('chooseAnotherLocation', async () => {
      const selectedHandle = await runPicker();
      await evaluatePickedFolder(selectedHandle, {
        allowCreateSubfolder: true,
      });
    });
  };

  const openExistingSpace = async () => {
    await withPicker('openExistingSpace', async () => {
      const selectedHandle = await runPicker();
      await evaluatePickedFolder(selectedHandle, {
        allowCreateSubfolder: false,
      });
    });
  };

  const useSelectedFolder = async () => {
    const state = dialogState.value;

    if (
      loading.value ||
      state === undefined ||
      (state.kind !== 'warning' && state.kind !== 'confirmUseFolder')
    ) {
      return;
    }

    loading.value = true;

    try {
      await mountMioframeSpace(state.handle);
    } catch (error) {
      handleUnexpectedPickerError(error, 'useSelectedFolder');
    } finally {
      loading.value = false;
    }
  };

  const createSubfolderFromSelectedFolder = async () => {
    const state = dialogState.value;

    if (loading.value || state?.kind !== 'warning') {
      return;
    }

    loading.value = true;

    try {
      const mioframeHandle = await createMioframeSubfolder(state.handle);
      await mountMioframeSpace(mioframeHandle);
    } catch (error) {
      if (!isUserFileSelectionCancel(error)) {
        addSnackbar({
          text: `Could not create the ${MIOFRAME_SPACE_FOLDER_NAME} folder. Choose or create a dedicated folder manually.`,
        });
        dialogState.value = { kind: 'create' };
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    isSupported,
    loading,
    dialogState,
    openMioframeSpaceDialog,
    openCreateDialog,
    openExistingSpace,
    createNewSpace,
    chooseAnotherLocation,
    useSelectedFolder,
    createSubfolderFromSelectedFolder,
    closeDialog,
  };
};
