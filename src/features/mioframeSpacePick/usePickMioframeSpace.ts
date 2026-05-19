import { useFileSystem } from '@entity/mountedDirectories';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { isFunction } from 'es-toolkit';
import { computed, ref, toRef } from 'vue';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { getMioframeSpaceNameError, normalizeMioframeSpaceName } from './spaceNameValidation';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';
const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT = 'Choose a folder where a Mioframe space has already been created.';
const EXISTING_SPACE_HEADLINE = 'Open existing Mioframe space?';
const EXISTING_SPACE_TEXT =
  'A Mioframe space with this name already exists in the selected location.';
const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';
const SPACE_FOLDER_PLACEHOLDER = '<space name>';

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

type CreateSpaceDialogState = {
  parentHandle: FileSystemDirectoryHandle;
  spaceName: string | undefined;
  errorText: string | undefined;
};

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * @returns Reactive dialog state and actions for the Mioframe space picker.
 */
export const usePickMioframeSpace = () => {
  const loading = ref(false);
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();
  const createSpaceDialogState = ref<CreateSpaceDialogState>();

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

  const closeCreateSpaceDialog = () => {
    createSpaceDialogState.value = undefined;
  };

  const askToRetryOpenSpace = async () =>
    await confirm({
      headline: OPEN_GUARDRAIL_HEADLINE,
      supportingText: OPEN_GUARDRAIL_TEXT,
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });

  const askToOpenExistingSpace = async () =>
    await confirm({
      headline: EXISTING_SPACE_HEADLINE,
      supportingText: EXISTING_SPACE_TEXT,
      confirmLabel: 'Open space',
      cancelLabel: 'Cancel',
    });

  const updateCreateSpaceName = (spaceName: string | undefined) => {
    if (!createSpaceDialogState.value) {
      return;
    }

    createSpaceDialogState.value.spaceName = spaceName;
    createSpaceDialogState.value.errorText = undefined;
  };

  const createSpace = async () => {
    await withPicker('createSpace', async () => {
      const parentHandle = await runPicker();
      createSpaceDialogState.value = {
        parentHandle,
        spaceName: undefined,
        errorText: undefined,
      };
    });
  };

  const submitCreateSpace = async () => {
    const dialogState = createSpaceDialogState.value;

    if (!dialogState || loading.value) {
      return;
    }

    const fieldError = getMioframeSpaceNameError(dialogState.spaceName);

    if (fieldError) {
      dialogState.errorText = fieldError;
      return;
    }

    const normalizedName = normalizeMioframeSpaceName(dialogState.spaceName);
    loading.value = true;

    try {
      let targetHandle: FileSystemDirectoryHandle;

      try {
        targetHandle = await dialogState.parentHandle.getDirectoryHandle(normalizedName);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          let createdHandle: FileSystemDirectoryHandle;

          try {
            createdHandle = await dialogState.parentHandle.getDirectoryHandle(normalizedName, {
              create: true,
            });
          } catch (createError) {
            if (createError instanceof TypeError) {
              dialogState.errorText = 'Enter a valid folder name.';
              return;
            }

            throw createError;
          }

          await mountMioframeSpace(createdHandle);
          closeCreateSpaceDialog();
          return;
        }

        if (error instanceof DOMException && error.name === 'TypeMismatchError') {
          dialogState.errorText = EXISTING_ORDINARY_FOLDER_ERROR;
          return;
        }

        if (error instanceof TypeError) {
          dialogState.errorText = 'Enter a valid folder name.';
          return;
        }

        throw error;
      }

      let inspection;

      try {
        inspection = await inspectMioframeSpaceDirectory(targetHandle);
      } catch {
        throw wrapUnexpectedInspectionError('createSpace');
      }

      if (inspection.looksLikeExistingSpace) {
        if (await askToOpenExistingSpace()) {
          await mountMioframeSpace(targetHandle);
          closeCreateSpaceDialog();
        }
        return;
      }

      dialogState.errorText = EXISTING_ORDINARY_FOLDER_ERROR;
    } catch (error) {
      handleUnexpectedPickerError(error, 'createSpace');
    } finally {
      loading.value = false;
    }
  };

  const tryOpenPickedSpace = async (): Promise<void> => {
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

    if (await askToRetryOpenSpace()) {
      await tryOpenPickedSpace();
    }
  };

  const openSpace = async () => {
    await withPicker('openSpace', async () => {
      await tryOpenPickedSpace();
    });
  };

  return {
    isSupported,
    loading,
    showCreateSpaceDialog: computed(() => !!createSpaceDialogState.value),
    createSpaceName: computed(() => createSpaceDialogState.value?.spaceName),
    createSpaceDialogError: computed(() => createSpaceDialogState.value?.errorText),
    createSpaceSelectedLocation: computed(
      () => createSpaceDialogState.value?.parentHandle.name ?? '',
    ),
    createSpaceResultFolder: computed(() => {
      const parentName = createSpaceDialogState.value?.parentHandle.name;
      if (!parentName) {
        return '';
      }

      const normalizedName = normalizeMioframeSpaceName(createSpaceDialogState.value?.spaceName);
      return `${parentName} / ${normalizedName || SPACE_FOLDER_PLACEHOLDER}`;
    }),
    createSpace,
    updateCreateSpaceName,
    submitCreateSpace,
    cancelCreateSpace: closeCreateSpaceDialog,
    openSpace,
  };
};
