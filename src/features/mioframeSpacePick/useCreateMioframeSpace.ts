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

export type CreateDialogStatus =
  | 'editing-name'
  | 'checking-name'
  | 'submitting'
  | 'existing-space-conflict';

export type CreateDialogState = {
  status: CreateDialogStatus;
  selectedLocation: string;
};

export class CreateMioframeSpaceFieldError extends Error {
  constructor(readonly fieldMessage: string) {
    super(fieldMessage);
    this.name = 'CreateMioframeSpaceFieldError';
  }
}

class CreateMioframeSpaceHandledError extends Error {
  constructor() {
    super('Create Mioframe space submission was handled');
    this.name = 'CreateMioframeSpaceHandledError';
  }
}

export const isCreateMioframeSpaceFieldError = (
  error: unknown,
): error is CreateMioframeSpaceFieldError => error instanceof CreateMioframeSpaceFieldError;

export const useCreateMioframeSpace = (parentHandle: Ref<FileSystemDirectoryHandle>) => {
  const loading = ref(false);
  const status = ref<CreateDialogStatus>('editing-name');
  const existingConflictTargetHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const createDialogState = computed<CreateDialogState>(() => ({
    status: status.value,
    selectedLocation: parentHandle.value.name,
  }));

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

  const submitCreateSpaceName = async (spaceName: string): Promise<void> => {
    if (loading.value) {
      throw new CreateMioframeSpaceHandledError();
    }

    const normalizedName = normalizeMioframeSpaceName(spaceName);
    loading.value = true;
    status.value = 'checking-name';
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
            status.value = 'editing-name';

            if (createError instanceof TypeError) {
              throwFieldError(INVALID_FOLDER_NAME_ERROR);
            }

            throw createError;
          }

          status.value = 'submitting';
          await addDeviceDirectory(createdHandle);
          return;
        }

        status.value = 'editing-name';

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
        status.value = 'existing-space-conflict';
        existingConflictTargetHandle.value = targetHandle;
        return;
      }

      status.value = 'editing-name';
      throwFieldError(EXISTING_ORDINARY_FOLDER_ERROR);
    } catch (error) {
      if (error instanceof CreateMioframeSpaceFieldError) {
        throw error;
      }

      status.value = 'editing-name';
      handleUnexpectedError(error);
      throw new CreateMioframeSpaceHandledError();
    } finally {
      loading.value = false;
    }
  };

  const openExistingSpaceFromConflict = async (): Promise<void> => {
    if (status.value !== 'existing-space-conflict' || loading.value) {
      throw new CreateMioframeSpaceHandledError();
    }

    const targetHandle = existingConflictTargetHandle.value;

    if (!targetHandle) {
      throw new CreateMioframeSpaceHandledError();
    }

    loading.value = true;
    status.value = 'submitting';

    try {
      await addDeviceDirectory(targetHandle);
    } catch (error) {
      status.value = 'existing-space-conflict';
      handleUnexpectedError(error);
      throw new CreateMioframeSpaceHandledError();
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
