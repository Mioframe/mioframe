import { useFileSystem } from '@entity/mountedDirectories';
import { ensureStorageAdapterMarkerFile } from '@shared/lib/automergeAdapter';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ref, toRef } from 'vue';
import {
  isDirectoryPickerSupported,
  pickWritableDirectory,
  showDirectoryPickerUnsupportedMessage,
} from './directoryPickerSupport';
import { buildCreateSpaceError, buildOpenSpaceError } from './mioframeSpacePick.errors';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { parseMioframeSpaceName } from './spaceNameValidation';

const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';
const INVALID_FOLDER_NAME_ERROR = 'Enter a valid folder name.';

/** Self-contained conflict state for an existing Mioframe space found during create. */
export interface CreateSpaceConflict {
  /** Stable discriminator for the create conflict branch. */
  status: 'existing-space-conflict';
  /** Current parent-folder label shown to the user. */
  selectedLocation: string;
  /** Parsed, normalized space name submitted by the user. */
  submittedSpaceName: string;
  /** Existing Mioframe directory handle that can be opened instead of recreated. */
  targetHandle: FileSystemDirectoryHandle;
}

/** Explicit create-space submit result for user-visible outcomes and handled failures. */
export type CreateSpaceSubmitResult =
  | {
      /** New Mioframe space was created, initialized, and mounted successfully. */
      status: 'created';
    }
  | {
      /** User-facing field validation or ordinary-folder conflict message. */
      status: 'field-error';
      /** Field-level message that should be shown in the create dialog. */
      fieldMessage: string;
    }
  | CreateSpaceConflict
  | {
      /** Unexpected failure was handled with privacy-safe diagnostics and UI feedback. */
      status: 'handled-error';
    };

/** Explicit conflict-resolution result when opening an existing Mioframe space. */
export type OpenExistingSpaceResult =
  | {
      /** Existing Mioframe space was mounted successfully. */
      status: 'opened-existing-space';
    }
  | {
      /** Unexpected failure was handled with privacy-safe diagnostics and UI feedback. */
      status: 'handled-error';
    };

/**
 * Manages Mioframe create-space picker, dialog, and conflict resolution state.
 * @returns Reactive picker/dialog state plus create/open actions.
 */
export const useCreateMioframeSpace = () => {
  const loading = ref(false);
  const parentHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
  const conflict = ref<CreateSpaceConflict | undefined>(undefined);
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();
  const isSupported = toRef(isDirectoryPickerSupported);

  const createConflictState = (
    submittedSpaceName: string,
    targetHandle: FileSystemDirectoryHandle,
  ): CreateSpaceConflict => ({
    status: 'existing-space-conflict',
    selectedLocation: parentHandle.value?.name ?? '',
    submittedSpaceName,
    targetHandle,
  });

  const handleUnexpectedError = (
    error: unknown,
    options?: {
      fallbackError?: DomainError;
      action?: 'pickParentFolder' | 'createSpace' | 'openExistingSpaceFromConflict';
    },
  ) => {
    const reportedError =
      error instanceof DomainError ? error : (options?.fallbackError ?? buildCreateSpaceError());

    addSnackbar({
      text: reportedError.message,
    });
    reportHandledError(reportedError, {
      feature: 'mioframeSpaceCreate',
      action: options?.action ?? 'createSpace',
    });
  };

  const resetCreateDialog = () => {
    parentHandle.value = undefined;
    conflict.value = undefined;
  };

  /**
   * Opens the parent-directory picker for creating a new Mioframe space.
   */
  const pickParentDirectory = async () => {
    if (loading.value || parentHandle.value) {
      return;
    }

    if (!isSupported.value) {
      showDirectoryPickerUnsupportedMessage(addSnackbar);
      return;
    }

    loading.value = true;

    try {
      parentHandle.value = await pickWritableDirectory();
    } catch {
      handleUnexpectedError(buildCreateSpaceError(), {
        action: 'pickParentFolder',
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Validates, creates, initializes, and mounts a new Mioframe space from the current parent folder.
   * @param rawSpaceName - Raw form value entered by the user.
   * @returns Explicit result for create success, validation, conflict, or handled failure.
   */
  const submitCreateSpaceName = async (rawSpaceName: string): Promise<CreateSpaceSubmitResult> => {
    if (loading.value || !parentHandle.value) {
      return {
        status: 'handled-error',
      };
    }

    const parsedSpaceName = parseMioframeSpaceName(rawSpaceName);

    if (!parsedSpaceName.success) {
      conflict.value = undefined;
      return {
        status: 'field-error',
        fieldMessage: parsedSpaceName.error,
      };
    }

    loading.value = true;
    conflict.value = undefined;

    try {
      let targetHandle: FileSystemDirectoryHandle;

      try {
        targetHandle = await parentHandle.value.getDirectoryHandle(parsedSpaceName.name);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
          let createdHandle: FileSystemDirectoryHandle;

          try {
            createdHandle = await parentHandle.value.getDirectoryHandle(parsedSpaceName.name, {
              create: true,
            });
          } catch (createError) {
            if (createError instanceof TypeError) {
              return {
                status: 'field-error',
                fieldMessage: INVALID_FOLDER_NAME_ERROR,
              };
            }

            throw createError;
          }

          await ensureStorageAdapterMarkerFile(createdHandle);
          await addDeviceDirectory(createdHandle);
          return {
            status: 'created',
          };
        }

        if (error instanceof DOMException && error.name === 'TypeMismatchError') {
          return {
            status: 'field-error',
            fieldMessage: EXISTING_ORDINARY_FOLDER_ERROR,
          };
        }

        if (error instanceof TypeError) {
          return {
            status: 'field-error',
            fieldMessage: INVALID_FOLDER_NAME_ERROR,
          };
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
        conflict.value = createConflictState(parsedSpaceName.name, targetHandle);
        return conflict.value;
      }

      return {
        status: 'field-error',
        fieldMessage: EXISTING_ORDINARY_FOLDER_ERROR,
      };
    } catch (error) {
      handleUnexpectedError(error);
      return {
        status: 'handled-error',
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mounts the currently conflicted existing Mioframe space instead of creating a new one.
   * @returns Explicit result for existing-space open success or handled failure.
   */
  const openExistingSpaceFromConflict = async (): Promise<OpenExistingSpaceResult> => {
    if (!conflict.value || loading.value) {
      return {
        status: 'handled-error',
      };
    }

    loading.value = true;
    const activeConflict = conflict.value;

    try {
      await addDeviceDirectory(activeConflict.targetHandle);
      return {
        status: 'opened-existing-space',
      };
    } catch (error) {
      conflict.value = activeConflict;
      handleUnexpectedError(error, {
        fallbackError: buildOpenSpaceError(),
        action: 'openExistingSpaceFromConflict',
      });
      return {
        status: 'handled-error',
      };
    } finally {
      loading.value = false;
    }
  };

  return {
    isSupported,
    loading,
    parentHandle,
    conflict,
    pickParentDirectory,
    resetCreateDialog,
    submitCreateSpaceName,
    openExistingSpaceFromConflict,
  };
};
