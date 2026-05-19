import { useFileSystem } from '@entity/mountedDirectories';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
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
const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';

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

type CreateFlowActiveState = {
  parentHandle: FileSystemDirectoryHandle;
  selectedLocation: string;
  resultFolder: string;
  spaceName: string | undefined;
  errorText: string | undefined;
};

type CreateFlowInternalState =
  | {
      status: 'idle';
    }
  | ({
      status: 'editing-name' | 'checking-name' | 'submitting';
    } & CreateFlowActiveState)
  | ({
      status: 'existing-space-conflict';
      targetHandle: FileSystemDirectoryHandle;
    } & CreateFlowActiveState);

type PublicCreateFlowIdleState = {
  status: 'idle';
};

type PublicCreateFlowDialogState = {
  status: 'editing-name' | 'checking-name' | 'submitting' | 'existing-space-conflict';
  selectedLocation: string;
  resultFolder: string;
  spaceName: string | undefined;
  errorText: string | undefined;
};

/**
 * Public create-space flow state consumed by the feature-owned dialog host.
 */
export type CreateFlowState = PublicCreateFlowIdleState | PublicCreateFlowDialogState;
const SPACE_FOLDER_PLACEHOLDER = '<space name>';

const buildResultFolder = (parentName: string, spaceName: string | undefined) => {
  const normalizedName = normalizeMioframeSpaceName(spaceName);
  return `${parentName} / ${normalizedName || SPACE_FOLDER_PLACEHOLDER}`;
};

const createActiveState = (
  parentHandle: FileSystemDirectoryHandle,
  spaceName: string | undefined,
  errorText?: string,
): CreateFlowActiveState => ({
  parentHandle,
  selectedLocation: parentHandle.name,
  resultFolder: buildResultFolder(parentHandle.name, spaceName),
  spaceName,
  errorText,
});

const createEditingState = (
  parentHandle: FileSystemDirectoryHandle,
  spaceName: string | undefined,
  errorText?: string,
): CreateFlowInternalState => ({
  status: 'editing-name',
  ...createActiveState(parentHandle, spaceName, errorText),
});

const createCheckingState = (
  parentHandle: FileSystemDirectoryHandle,
  spaceName: string | undefined,
): CreateFlowInternalState => ({
  status: 'checking-name',
  ...createActiveState(parentHandle, spaceName, undefined),
});

const createSubmittingState = (
  parentHandle: FileSystemDirectoryHandle,
  spaceName: string | undefined,
): CreateFlowInternalState => ({
  status: 'submitting',
  ...createActiveState(parentHandle, spaceName, undefined),
});

const createExistingConflictState = (
  parentHandle: FileSystemDirectoryHandle,
  spaceName: string | undefined,
  targetHandle: FileSystemDirectoryHandle,
): CreateFlowInternalState => ({
  status: 'existing-space-conflict',
  targetHandle,
  ...createActiveState(parentHandle, spaceName, undefined),
});

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * @returns Reactive dialog state and actions for the Mioframe space picker.
 */
const setupPickMioframeSpace = () => {
  const loading = ref(false);
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();
  const createFlowInternalState = ref<CreateFlowInternalState>({
    status: 'idle',
  });

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
    createFlowInternalState.value = {
      status: 'idle',
    };
  };

  const askToRetryOpenSpace = async () =>
    await confirm({
      headline: OPEN_GUARDRAIL_HEADLINE,
      supportingText: OPEN_GUARDRAIL_TEXT,
      confirmLabel: 'Choose another folder',
      cancelLabel: 'Cancel',
    });

  const updateCreateSpaceName = (spaceName: string | undefined) => {
    if (createFlowInternalState.value.status === 'idle') {
      return;
    }

    createFlowInternalState.value = createEditingState(
      createFlowInternalState.value.parentHandle,
      spaceName,
    );
  };

  const createSpace = async () => {
    await withPicker('createSpace', async () => {
      const parentHandle = await runPicker();
      createFlowInternalState.value = createEditingState(parentHandle, undefined);
    });
  };

  const submitCreateSpace = async () => {
    const dialogState = createFlowInternalState.value;

    if (
      dialogState.status === 'idle' ||
      dialogState.status === 'existing-space-conflict' ||
      loading.value
    ) {
      return;
    }

    const fieldError = getMioframeSpaceNameError(dialogState.spaceName);

    if (fieldError) {
      createFlowInternalState.value = createEditingState(
        dialogState.parentHandle,
        dialogState.spaceName,
        fieldError,
      );
      return;
    }

    const normalizedName = normalizeMioframeSpaceName(dialogState.spaceName);
    loading.value = true;
    createFlowInternalState.value = createCheckingState(
      dialogState.parentHandle,
      dialogState.spaceName,
    );

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
              createFlowInternalState.value = createEditingState(
                dialogState.parentHandle,
                dialogState.spaceName,
                'Enter a valid folder name.',
              );
              return;
            }

            throw createError;
          }

          createFlowInternalState.value = createSubmittingState(
            dialogState.parentHandle,
            dialogState.spaceName,
          );
          await mountMioframeSpace(createdHandle);
          closeCreateSpaceDialog();
          return;
        }

        if (error instanceof DOMException && error.name === 'TypeMismatchError') {
          createFlowInternalState.value = createEditingState(
            dialogState.parentHandle,
            dialogState.spaceName,
            EXISTING_ORDINARY_FOLDER_ERROR,
          );
          return;
        }

        if (error instanceof TypeError) {
          createFlowInternalState.value = createEditingState(
            dialogState.parentHandle,
            dialogState.spaceName,
            'Enter a valid folder name.',
          );
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
        createFlowInternalState.value = createExistingConflictState(
          dialogState.parentHandle,
          dialogState.spaceName,
          targetHandle,
        );
        return;
      }

      createFlowInternalState.value = createEditingState(
        dialogState.parentHandle,
        dialogState.spaceName,
        EXISTING_ORDINARY_FOLDER_ERROR,
      );
    } catch (error) {
      createFlowInternalState.value = createEditingState(
        dialogState.parentHandle,
        dialogState.spaceName,
      );
      handleUnexpectedPickerError(error, 'createSpace');
    } finally {
      loading.value = false;
    }
  };

  const openExistingSpaceFromConflict = async () => {
    const dialogState = createFlowInternalState.value;

    if (dialogState.status !== 'existing-space-conflict' || loading.value) {
      return;
    }

    loading.value = true;
    createFlowInternalState.value = createSubmittingState(
      dialogState.parentHandle,
      dialogState.spaceName,
    );

    try {
      await mountMioframeSpace(dialogState.targetHandle);
      closeCreateSpaceDialog();
    } catch (error) {
      createFlowInternalState.value = createExistingConflictState(
        dialogState.parentHandle,
        dialogState.spaceName,
        dialogState.targetHandle,
      );
      handleUnexpectedPickerError(error, 'createSpace');
    } finally {
      loading.value = false;
    }
  };

  const openSpace = async () => {
    await withPicker('openSpace', async () => {
      // Sequential picker, inspection, and confirmation steps are the intended retry flow here.
      for (;;) {
        // eslint-disable-next-line no-await-in-loop -- The next picker must wait for the prior retry choice.
        const selectedHandle = await runPicker();
        let inspection;

        try {
          // eslint-disable-next-line no-await-in-loop -- Inspection depends on the folder chosen in this loop iteration.
          inspection = await inspectMioframeSpaceDirectory(selectedHandle);
        } catch {
          throw wrapUnexpectedInspectionError('openSpace');
        }

        if (inspection.looksLikeExistingSpace) {
          // eslint-disable-next-line no-await-in-loop -- Mounting is the successful terminal action for this iteration.
          await mountMioframeSpace(selectedHandle);
          return;
        }

        // eslint-disable-next-line no-await-in-loop -- Retry confirmation is part of the sequential open-space flow.
        if (!(await askToRetryOpenSpace())) {
          return;
        }
      }
    });
  };

  return {
    isSupported,
    loading,
    createFlowState: computed<CreateFlowState>(() => {
      const state = createFlowInternalState.value;

      if (state.status === 'idle') {
        return state;
      }

      return {
        status: state.status,
        selectedLocation: state.selectedLocation,
        resultFolder: state.resultFolder,
        spaceName: state.spaceName,
        errorText: state.errorText,
      };
    }),
    createSpace,
    updateCreateSpaceName,
    submitCreateSpace,
    cancelCreateSpace: closeCreateSpaceDialog,
    openExistingSpaceFromConflict,
    openSpace,
  };
};

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * Shared state lets the LocalFS widget trigger actions while the feature host owns dialog rendering.
 * @returns Mioframe space actions plus explicit create-flow state for the feature host.
 */
export const usePickMioframeSpace = createGlobalState(setupPickMioframeSpace);
