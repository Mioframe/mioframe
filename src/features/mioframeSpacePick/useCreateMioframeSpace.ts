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

/** Reactive create-dialog states shown after parent-folder selection. */
export type CreateDialogState =
  | {
      /** The dialog is editing or validating a new space name, or mounting a new space. */
      status: 'editing-name' | 'checking-name' | 'submitting';
      /** Current parent-folder label shown in the dialog. */
      selectedLocation: string;
    }
  | {
      /** The submitted name matches an existing Mioframe space in the selected location. */
      status: 'existing-space-conflict';
      /** Current parent-folder label shown in the dialog. */
      selectedLocation: string;
      /** Conflicting space name that may be opened instead of recreated. */
      conflictSpaceName: string;
    };

/** Field-level validation error surfaced back to the create-space dialog. */
export class CreateMioframeSpaceFieldError extends Error {
  /**
   * @param fieldMessage - User-facing validation message for the space-name field.
   */
  constructor(readonly fieldMessage: string) {
    super(fieldMessage);
    this.name = 'CreateMioframeSpaceFieldError';
  }
}

/**
 * Checks whether an unknown error is the create-space field-validation sentinel.
 * @param error - Unknown thrown value from the create-space flow.
 * @returns True when the error is a `CreateMioframeSpaceFieldError`.
 */
export const isCreateMioframeSpaceFieldError = (
  error: unknown,
): error is CreateMioframeSpaceFieldError => error instanceof CreateMioframeSpaceFieldError;

/**
 * Manages create-space dialog state after the user has picked a parent directory.
 * @param parentHandle - Directory where the new Mioframe space may be created.
 * @returns Reactive dialog state plus create/open actions for the current parent directory.
 */
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

  /**
   * Returns true only when the space was created and mounted successfully, so the dialog may close.
   * Returns false when the dialog must remain open because the flow moved to another state or handled an error.
   * @param spaceName - User-entered space name to validate, inspect, create, and mount.
   * @returns Whether the create flow completed and the dialog may close.
   */
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

    return false;
  };

  /**
   * Returns true only when the existing conflicted space was mounted successfully, so the dialog may close.
   * Returns false when the dialog must remain open because the flow stayed in conflict or handled an error.
   * @returns Whether the existing-space open flow completed and the dialog may close.
   */
  const openExistingSpaceFromConflict = async (): Promise<boolean> => {
    if (createDialogState.value.status !== 'existing-space-conflict' || loading.value) {
      return false;
    }

    const targetHandle = existingConflictTargetHandle.value;
    const conflictSpaceName = createDialogState.value.conflictSpaceName;

    if (!targetHandle) {
      return false;
    }

    loading.value = true;
    setStatus('submitting');

    try {
      await addDeviceDirectory(targetHandle);
      return true;
    } catch (error) {
      setConflictState(conflictSpaceName, targetHandle);
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
