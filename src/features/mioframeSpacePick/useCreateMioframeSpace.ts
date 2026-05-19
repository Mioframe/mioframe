import { useFileSystem } from '@entity/mountedDirectories';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { isFunction } from 'es-toolkit';
import { computed, ref, toRef } from 'vue';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { normalizeMioframeSpaceName } from './spaceNameValidation';
import { buildCreateSpaceError } from './mioframeSpacePick.errors';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';

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

export type CreateDialogState = {
  status: 'editing-name' | 'checking-name' | 'submitting' | 'existing-space-conflict';
  selectedLocation: string;
};

export type CreateFlowState = PublicCreateFlowIdleState | CreateDialogState;

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

const setupCreateMioframeSpace = () => {
  const loading = ref(false);
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();
  const createFlowInternalState = ref<CreateFlowInternalState>({
    status: 'idle',
  });

  const isSupported = toRef(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );
  const createDialogState = computed<CreateDialogState | undefined>(() => {
    const state = createFlowInternalState.value;

    if (state.status === 'idle') {
      return undefined;
    }

    return {
      status: state.status,
      selectedLocation: state.selectedLocation,
    };
  });
  const hasActiveDialog = computed(() => createDialogState.value !== undefined);

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
    const reportedError = error instanceof DomainError ? error : buildCreateSpaceError();

    addSnackbar({
      text: reportedError.message,
    });
    reportHandledError(reportedError, {
      feature: 'mioframeSpaceCreate',
      action: 'createSpace',
    });
  };

  const runPicker = async () =>
    await window.showDirectoryPicker({
      mode: 'readwrite',
    });

  const closeCreateSpaceDialog = () => {
    createFlowInternalState.value = {
      status: 'idle',
    };
  };

  const createSpace = async () => {
    if (loading.value || hasActiveDialog.value) {
      return;
    }

    if (!isSupported.value) {
      showUnsupportedMessage();
      return;
    }

    loading.value = true;

    try {
      const parentHandle = await runPicker();
      createFlowInternalState.value = createActiveState('editing-name', parentHandle);
    } catch (error) {
      if (!isUserFileSelectionCancel(error)) {
        handleUnexpectedError(error);
      }
    } finally {
      loading.value = false;
    }
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
          await addDeviceDirectory(createdHandle);
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
        throw buildCreateSpaceError();
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
      handleUnexpectedError(error);
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
      await addDeviceDirectory(dialogState.targetHandle);
      closeCreateSpaceDialog();
      return true;
    } catch (error) {
      createFlowInternalState.value = createExistingConflictState(
        dialogState.parentHandle,
        dialogState.targetHandle,
      );
      handleUnexpectedError(error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    isSupported,
    loading,
    hasActiveDialog,
    createDialogState,
    createFlowState: computed<CreateFlowState>(() => createDialogState.value ?? { status: 'idle' }),
    createSpace,
    submitCreateSpaceName,
    cancelCreateSpace: closeCreateSpaceDialog,
    openExistingSpaceFromConflict,
  };
};

export const useCreateMioframeSpace = createGlobalState(setupCreateMioframeSpace);
