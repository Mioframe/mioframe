import { useFileSystem } from '@entity/mountedDirectories';
import { computed, ref, type Ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { normalizeMioframeSpaceName } from './spaceNameValidation';
import { buildCreateSpaceError } from './mioframeSpacePick.errors';

export type CreateDialogStatus =
  | 'editing-name'
  | 'checking-name'
  | 'submitting'
  | 'existing-space-conflict';

export type CreateDialogState = {
  status: CreateDialogStatus;
  selectedLocation: string;
};

export type CreateSpaceNameSubmitResult =
  | { status: 'created' }
  | { status: 'existing-space-conflict' }
  | { status: 'ordinary-folder-exists' }
  | { status: 'invalid-folder-name' }
  | { status: 'failed' };

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

  const submitCreateSpaceName = async (
    spaceName: string,
  ): Promise<CreateSpaceNameSubmitResult> => {
    if (loading.value) {
      return { status: 'failed' };
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
              return { status: 'invalid-folder-name' };
            }

            throw createError;
          }

          status.value = 'submitting';
          await addDeviceDirectory(createdHandle);
          return { status: 'created' };
        }

        status.value = 'editing-name';

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
        status.value = 'existing-space-conflict';
        existingConflictTargetHandle.value = targetHandle;
        return { status: 'existing-space-conflict' };
      }

      status.value = 'editing-name';
      return { status: 'ordinary-folder-exists' };
    } catch (error) {
      status.value = 'editing-name';
      handleUnexpectedError(error);
      return { status: 'failed' };
    } finally {
      loading.value = false;
    }
  };

  const openExistingSpaceFromConflict = async (): Promise<boolean> => {
    if (status.value !== 'existing-space-conflict' || loading.value) {
      return false;
    }

    const targetHandle = existingConflictTargetHandle.value;

    if (!targetHandle) {
      return false;
    }

    loading.value = true;
    status.value = 'submitting';

    try {
      await addDeviceDirectory(targetHandle);
      return true;
    } catch (error) {
      status.value = 'existing-space-conflict';
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
