import { useFileSystem } from '@entity/mountedDirectories';
import { computed, ref, type Ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { normalizeMioframeSpaceName } from './spaceNameValidation';
import { buildCreateSpaceError } from './mioframeSpacePick.errors';

const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';
const INVALID_FOLDER_NAME_ERROR = 'Enter a valid folder name.';

export type CreateDialogState =
  | {
      status: 'editing-name' | 'checking-name' | 'submitting';
      selectedLocation: string;
    }
  | {
      status: 'existing-space-conflict';
      selectedLocation: string;
      conflictSpaceName: string;
    };

export class CreateMioframeSpaceFieldError extends Error {
  constructor(readonly fieldMessage: string) {
    super(fieldMessage);
    this.name = 'CreateMioframeSpaceFieldError';
  }
}

export const isCreateMioframeSpaceFieldError = (
  error: unknown,
): error is CreateMioframeSpaceFieldError => error instanceof CreateMioframeSpaceFieldError;

export const useCreateMioframeSpace = (parentHandle: Ref<FileSystemDirectoryHandle>) => {
  const loading = ref(false);
  const createDialogState = ref<CreateDialogState>({
    status: 'editing-name',
    selectedLocation: parentHandle.value.name,
  });
  const existingConflictTargetHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const selectedLocation = computed(() => parentHandle.value.name);

  const setStatus = (status: Exclude<CreateDialogState['status'], 'existing-space-conflict'>) => {
    createDialogState.value = {
      status,
      selectedLocation: selectedLocation.value,
    };
  };

  const setConflictState = (spaceName: string, targetHandle: FileSystemDirectoryHandle) => {
    existingConflictTargetHandle.value = targetHandle;
    createDialogState.value = {
      status: 'existing-space-conflict',
      selectedLocation: selectedLocation.value,
      conflictSpaceName: spaceName,
    };
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

  const throwFieldError = (fieldMessage: string): never => {
    throw new CreateMioframeSpaceFieldError(fieldMessage);
  };

  const submitCreateSpaceName = async (spaceName: string): Promise<boolean> => {
    if (loading.value) {
      return false;
    }

    const normalizedName = normalizeMioframeSpaceName(spaceName);
    loading.value = true;
    setStatus('checking-name');
    existingConflictTargetHandle.value = undefined;

    try {
      let targetHandle: FileSystemDirectoryHandle;

      try {
        targetHandle = await parentHandle.value.getDirectoryHandle(normalizedName);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          let createdHandle: FileSystemDirectoryHandle;

          try {
            createdHandle = await parentHandle.value.getDirectoryHandle(normalizedName, {
              create: true,
            });
          } catch (createError) {
            setStatus('editing-name');

            if (createError instanceof TypeError) {
              throwFieldError(INVALID_FOLDER_NAME_ERROR);
            }

            throw createError;
          }

          setStatus('submitting');
          await addDeviceDirectory(createdHandle);
          return true;
        }

        setStatus('editing-name');

        if (error instanceof DOMException && error.name === 'TypeMismatchError') {
          throwFieldError(EXISTING_ORDINARY_FOLDER_ERROR);
        }

        if (error instanceof TypeError) {
          throwFieldError(INVALID_FOLDER_NAME_ERROR);
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
        setConflictState(normalizedName, targetHandle);
        return false;
      }

      setStatus('editing-name');
      throwFieldError(EXISTING_ORDINARY_FOLDER_ERROR);
    } catch (error) {
      if (error instanceof CreateMioframeSpaceFieldError) {
        throw error;
      }

      setStatus('editing-name');
      handleUnexpectedError(error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const openExistingSpaceFromConflict = async (): Promise<boolean> => {
    if (createDialogState.value.status !== 'existing-space-conflict' || loading.value) {
      return false;
    }

    const targetHandle = existingConflictTargetHandle.value;

    if (!targetHandle) {
      return false;
    }

    loading.value = true;
    setStatus('submitting');

    try {
      await addDeviceDirectory(targetHandle);
      return true;
    } catch (error) {
      setConflictState(createDialogState.value.selectedLocation, targetHandle);
      handleUnexpectedError(error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    createDialogState,
    submitCreateSpaceName,
    openExistingSpaceFromConflict,
  };
};
