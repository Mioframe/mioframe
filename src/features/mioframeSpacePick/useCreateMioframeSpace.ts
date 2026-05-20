import { useFileSystem } from '@entity/mountedDirectories';
import { ensureStorageAdapterMarkerFile } from '@shared/lib/automergeAdapter';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import { buildCreateSpaceError, buildOpenSpaceError } from './mioframeSpacePick.errors';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';

const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';
const INVALID_EXISTING_SPACE_ERROR =
  'A Mioframe space with this name already exists here. Open the existing space, or choose another name.';
const INVALID_FOLDER_NAME_ERROR = 'Enter a valid folder name.';

interface CreateSpaceTextIssue {
  /** Stable discriminator for a plain text field issue. */
  kind: 'text';
  /** User-facing field issue text. */
  text: string;
}

interface CreateSpaceExistingSpaceIssue {
  /** Stable discriminator for an existing Mioframe space conflict. */
  kind: 'existing-space';
  /** User-facing field issue text. */
  text: string;
  /** Parsed normalized name that produced the conflict. */
  normalizedName: string;
  /** Existing Mioframe directory handle that can be opened instead. */
  targetHandle: FileSystemDirectoryHandle;
}

/** Field-level create-space issues surfaced to the dialog. */
export type CreateSpaceNameIssue = CreateSpaceTextIssue | CreateSpaceExistingSpaceIssue;
type CreateSpaceResult = boolean | CreateSpaceNameIssue;

/** Internal error used to stop submit handling after availability-check diagnostics were reported. */
class HandledCreateSpaceAvailabilityError extends Error {}

/**
 * Owns create/open filesystem actions for a selected Mioframe-space parent directory.
 * @param parentHandleSource - Selected parent directory handle source.
 * @returns Reactive loading state plus filesystem-backed create/open actions.
 */
export const useCreateMioframeSpace = (
  parentHandleSource: MaybeRefOrGetter<FileSystemDirectoryHandle | undefined>,
) => {
  const loading = ref(false);
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const getParentHandle = () => toValue(parentHandleSource);

  const handleUnexpectedError = (
    error: unknown,
    options?: {
      fallbackError?: DomainError;
      action?: 'createSpace' | 'openExistingSpace';
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

  const classifyExistingTarget = async (
    normalizedName: string,
  ): Promise<CreateSpaceNameIssue | undefined> => {
    const parentHandle = getParentHandle();

    if (!parentHandle) {
      return undefined;
    }

    let targetHandle: FileSystemDirectoryHandle;

    try {
      targetHandle = await parentHandle.getDirectoryHandle(normalizedName);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return undefined;
      }

      if (error instanceof DOMException && error.name === 'TypeMismatchError') {
        return {
          kind: 'text',
          text: EXISTING_ORDINARY_FOLDER_ERROR,
        };
      }

      if (error instanceof TypeError) {
        return {
          kind: 'text',
          text: INVALID_FOLDER_NAME_ERROR,
        };
      }

      throw error;
    }

    const inspection = await inspectMioframeSpaceDirectory(targetHandle);

    if (inspection.looksLikeExistingSpace) {
      return {
        kind: 'existing-space',
        text: INVALID_EXISTING_SPACE_ERROR,
        normalizedName,
        targetHandle,
      };
    }

    return {
      kind: 'text',
      text: EXISTING_ORDINARY_FOLDER_ERROR,
    };
  };

  /**
   * Checks whether the submitted normalized space name can be created in the current parent folder.
   * @param normalizedName - Parsed and normalized space name.
   * @returns Field issue when the name cannot be used, otherwise `undefined`.
   */
  const checkCreateSpaceNameAvailability = async (
    normalizedName: string,
  ): Promise<CreateSpaceNameIssue | undefined> => {
    if (loading.value || !getParentHandle()) {
      return undefined;
    }

    loading.value = true;

    try {
      return await classifyExistingTarget(normalizedName);
    } catch (error) {
      handleUnexpectedError(error);
      throw new HandledCreateSpaceAvailabilityError();
    } finally {
      loading.value = false;
    }
  };

  /**
   * Creates, initializes, and mounts a new Mioframe space from the current parent folder.
   * @param normalizedName - Parsed and normalized space name.
   * @returns `true` on success, a field issue if the name became unavailable, otherwise `false`.
   */
  const createSpace = async (normalizedName: string): Promise<CreateSpaceResult> => {
    const parentHandle = getParentHandle();

    if (loading.value || !parentHandle) {
      return false;
    }

    loading.value = true;

    try {
      const existingTargetIssue = await classifyExistingTarget(normalizedName);

      if (existingTargetIssue) {
        return existingTargetIssue;
      }

      const createdHandle = await parentHandle.getDirectoryHandle(normalizedName, {
        create: true,
      });
      await ensureStorageAdapterMarkerFile(createdHandle);
      await addDeviceDirectory(createdHandle);
      return true;
    } catch (error) {
      handleUnexpectedError(error, {
        action: 'createSpace',
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mounts an already existing Mioframe space.
   * @param targetHandle - Existing directory handle already verified as a Mioframe space.
   * @returns `true` on success, otherwise `false` after handled diagnostics.
   */
  const openExistingSpace = async (targetHandle: FileSystemDirectoryHandle): Promise<boolean> => {
    if (loading.value) {
      return false;
    }

    loading.value = true;

    try {
      await addDeviceDirectory(targetHandle);
      return true;
    } catch (error) {
      handleUnexpectedError(error, {
        fallbackError: buildOpenSpaceError(),
        action: 'openExistingSpace',
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    checkCreateSpaceNameAvailability,
    createSpace,
    openExistingSpace,
  };
};
