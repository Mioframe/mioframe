import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';

/**
 * Summary of the folder inspection used by Mioframe space selection.
 */
export type MioframeSpaceInspection = {
  /** Whether the folder contains the current Mioframe service marker. */
  looksLikeExistingSpace: boolean;
};

/**
 * Returns whether the thrown marker lookup error means the marker file is simply absent.
 * @param error - Marker lookup failure.
 * @returns Whether the folder is missing the current marker file.
 */
export const isMissingMioframeSpaceMarkerError = (error: unknown) =>
  error instanceof DOMException && error.name === 'NotFoundError';

/**
 * Inspects a picked folder to decide whether it already contains the current Mioframe marker.
 * @param handle - Folder handle selected by the user.
 * @returns Summary of whether the folder is an existing Mioframe space.
 */
export const inspectMioframeSpaceDirectory = async (
  handle: FileSystemDirectoryHandle,
): Promise<MioframeSpaceInspection> => {
  if (!storageAdapterMarkerFileName) {
    throw new Error('Missing storage adapter marker filename');
  }

  try {
    await handle.getFileHandle(storageAdapterMarkerFileName);

    return {
      looksLikeExistingSpace: true,
    };
  } catch (error) {
    if (!isMissingMioframeSpaceMarkerError(error)) {
      throw error;
    }
  }

  return {
    looksLikeExistingSpace: false,
  };
};
