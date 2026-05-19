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
import { normalizeMioframeSpaceName } from './spaceNameValidation';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';
const OPEN_GUARDRAIL_HEADLINE = 'No Mioframe space found';
const OPEN_GUARDRAIL_TEXT = 'Choose a folder where a Mioframe space has already been created.';

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
};

/** Public create-space flow state consumed by the feature-owned list item. */
export type CreateFlowState = PublicCreateFlowIdleState | PublicCreateFlowDialogState;

/** Result of submitting a locally validated create-space name from the dialog. */
export type CreateSpaceNameSubmitResult =
  | { status: 'created' }
  | { status: 'existing-space-conflict' }
  | { status: 'ordinary-folder-exists' }
  | { status: 'invalid-folder-name' }
  | { status: 'failed' };

const createActiveState = (
  status: Exclude<CreateFlowInternalState['status'], 'idle' | 'existing-space-conflict'>,
  parentHandle: FileSystemDirectoryHandle,
): CreateFlowInternalState => ({
  status,
  parentHandle,
  selectedLocation: parentHandle.name,
});

const createExistingConflictState = (
  parentHandle: FileSystemDirectoryHandle,
  targetHandle: FileSystemDirectoryHandle,
): CreateFlowInternalState => ({
  status: 'existing-space-conflict',
  parentHandle,
  targetHandle,
  selectedLocation: parentHandle.name,
});

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * @returns Reactive flow state and actions for the Mioframe space picker.
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
  const hasActiveDialog = computed(() => createFlowInternalState.value.status !== 'idle');

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

  const runPicker = async () =>
    await window.showDirectoryPicker({
      mode: 'readwrite',
    });

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

  const createSpace = async () => {
    if (hasActiveDialog.value) {
      return;
    }

    await withPicker('createSpace', async () => {
      const parentHandle = await runPicker();
      createFlowInternalState.value = createActiveState('editing-name', parentHandle);
    });
  };

  const submitCreateSpaceName = async (
    spaceName: string,
  ): Promise<CreateSpaceNameSubmitResult> => {
    const dialogState = createFlowInternalState.value;

    if (dialogState.status === 'idle' || loading.value) {
      return { status: 'failed' };
    }

    const normalizedName = normalizeMioframeSpaceName(spaceName);
    loading.value = true;
    createFlowInternalState.value = createActiveState('checking-name', dialogState.parentHandle);

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
            createFlowInternalState.value = createActiveState('editing-name', dialogState.parentHandle);

            if (createError instanceof TypeError) {
              return { status: 'invalid-folder-name' };
            }

            throw createError;
          }

          createFlowInternalState.value = createActiveState('submitting', dialogState.parentHandle);
          await mountMioframeSpace(createdHandle);
          closeCreateSpaceDialog();
          return { status: 'created' };
        }

        createFlowInternalState.value = createActiveState('editing-name', dialogState.parentHandle);

        if (error instanceof DOMException && error.name === 'TypeMismatchError') {
          return { status: 'ordinary-folder-exists' };
        }

        if (error instanceof TypeError) {
          return { status: 'invalid-folder-name' };
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
          targetHandle,
        );
        return { status: 'existing-space-conflict' };
      }

      createFlowInternalState.value = createActiveState('editing-name', dialogState.parentHandle);
      return { status: 'ordinary-folder-exists' };
    } catch (error) {
      createFlowInternalState.value = createActiveState('editing-name', dialogState.parentHandle);
      handleUnexpectedPickerError(error, 'createSpace');
      return { status: 'failed' };
    } finally {
      loading.value = false;
    }
  };

  const openExistingSpaceFromConflict = async (): Promise<boolean> => {
    const dialogState = createFlowInternalState.value;

    if (dialogState.status !== 'existing-space-conflict' || loading.value) {
      return false;
    }

    loading.value = true;
    createFlowInternalState.value = createActiveState('submitting', dialogState.parentHandle);

    try {
      await mountMioframeSpace(dialogState.targetHandle);
      closeCreateSpaceDialog();
      return true;
    } catch (error) {
      createFlowInternalState.value = createExistingConflictState(
        dialogState.parentHandle,
        dialogState.targetHandle,
      );
      handleUnexpectedPickerError(error, 'createSpace');
      return false;
    } finally {
      loading.value = false;
    }
  };

  const pickExistingMioframeSpace = async () => {
    /* eslint-disable no-await-in-loop -- The retry flow is intentionally sequential: pick, inspect, confirm, then optionally pick again. */
    for (;;) {
      const selectedHandle = await runPicker();
      let inspection;

      try {
        inspection = await inspectMioframeSpaceDirectory(selectedHandle);
      } catch {
        throw wrapUnexpectedInspectionError('openSpace');
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
    if (hasActiveDialog.value) {
      return;
    }

    await withPicker('openSpace', async () => {
      const selectedHandle = await pickExistingMioframeSpace();

      if (!selectedHandle) {
        return;
      }

      await mountMioframeSpace(selectedHandle);
    });
  };

  return {
    isSupported,
    loading,
    hasActiveDialog,
    createFlowState: computed<CreateFlowState>(() => {
      const state = createFlowInternalState.value;

      if (state.status === 'idle') {
        return state;
      }

      return {
        status: state.status,
        selectedLocation: state.selectedLocation,
      };
    }),
    createSpace,
    submitCreateSpaceName,
    cancelCreateSpace: closeCreateSpaceDialog,
    openExistingSpaceFromConflict,
    openSpace,
  };
};

/**
 * Creates the user-facing flow for creating or opening a Mioframe space.
 * Shared state lets the feature-owned list items coordinate create and open flows.
 * @returns Mioframe space actions plus explicit create-flow state for the feature list items.
 */
export const usePickMioframeSpace = createGlobalState(setupPickMioframeSpace);
