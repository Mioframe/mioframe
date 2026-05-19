const CURRENT_MIOFRAME_SPACE_MARKER = 'storage-adapter-id.automerge';

const RISKY_FOLDER_NAMES = new Set([
  'desktop',
  'documents',
  'downloads',
  'my drive',
  'drive',
  'onedrive',
  'icloud drive',
]);
/**
 * Summary of the folder inspection used by Mioframe space selection.
 */
export type MioframeSpaceInspection = {
  /** Whether the folder currently contains no entries. */
  isEmpty: boolean;
  /** Whether the folder contains the current Mioframe service marker. */
  looksLikeExistingSpace: boolean;
  /** Whether the visible folder name is a broad common user folder. */
  looksRiskyByName: boolean;
  /** Whether the folder contains unrelated entries without the current marker. */
  hasOrdinaryEntries: boolean;
};

/**
 * Returns whether the thrown marker lookup error means the marker file is simply absent.
 * @param error - Marker lookup failure.
 * @returns Whether the folder is missing the current marker file.
 */
export const isMissingMioframeSpaceMarkerError = (error: unknown) =>
  error instanceof DOMException && error.name === 'NotFoundError';

/**
 * Returns whether the selected folder name commonly represents a broad user folder.
 * @param name - User-visible folder name reported by the picker handle.
 * @returns Whether the folder name should be treated as risky for a new space.
 */
export const isRiskyMioframeSpaceFolderName = (name: string) =>
  RISKY_FOLDER_NAMES.has(name.trim().toLowerCase());

/**
 * Inspects a picked folder to decide whether it is empty, already contains the current Mioframe
 * marker, or contains ordinary entries that require explicit confirmation before reuse.
 * @param handle - Folder handle selected by the user.
 * @returns Summary of the folder inspection.
 */
export const inspectMioframeSpaceDirectory = async (
  handle: FileSystemDirectoryHandle,
): Promise<MioframeSpaceInspection> => {
  const looksRiskyByName = isRiskyMioframeSpaceFolderName(handle.name);

  try {
    await handle.getFileHandle(CURRENT_MIOFRAME_SPACE_MARKER);

    return {
      looksLikeExistingSpace: true,
      isEmpty: false,
      hasOrdinaryEntries: false,
      looksRiskyByName,
    };
  } catch (error) {
    if (!isMissingMioframeSpaceMarkerError(error)) {
      throw error;
    }
  }

  const firstEntry = await handle.values().next();

  return {
    isEmpty: firstEntry.done ?? false,
    looksLikeExistingSpace: false,
    looksRiskyByName,
    hasOrdinaryEntries: !(firstEntry.done ?? false),
  };
};
