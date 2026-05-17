import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import { zodIs } from '@shared/lib/validateZodScheme';

/** Preferred dedicated folder name for a Mioframe space. */
export const MIOFRAME_SPACE_FOLDER_NAME = 'Mioframe';
const RISKY_FOLDER_NAMES = new Set([
  'desktop',
  'documents',
  'downloads',
  'my drive',
  'drive',
  'onedrive',
  'icloud drive',
]);
const MAX_SCANNED_ENTRIES = 24;
const MANY_ORDINARY_ENTRIES_THRESHOLD = 12;

export type MioframeSpaceInspection = {
  isEmpty: boolean;
  looksLikeExistingSpace: boolean;
  looksRiskyByName: boolean;
  looksLargeAndOrdinary: boolean;
  scannedEntryCount: number;
};

/**
 * Returns whether the selected folder name commonly represents a broad user folder.
 * @param name - User-visible folder name reported by the picker handle.
 */
export const isRiskyMioframeSpaceFolderName = (name: string) =>
  RISKY_FOLDER_NAMES.has(name.trim().toLowerCase());

/**
 * Creates or resolves the dedicated Mioframe subfolder inside a parent folder.
 * @param handle - Parent folder handle selected by the user.
 */
export const createMioframeSubfolder = async (handle: FileSystemDirectoryHandle) =>
  handle.getDirectoryHandle(MIOFRAME_SPACE_FOLDER_NAME, { create: true });

/**
 * Inspects the visible entries of a picked folder to decide whether it already looks like a Mioframe space.
 * @param handle - Folder handle selected by the user.
 */
export const inspectMioframeSpaceDirectory = async (
  handle: FileSystemDirectoryHandle,
): Promise<MioframeSpaceInspection> => {
  let scannedEntryCount = 0;
  let ordinaryEntryCount = 0;
  let automergeFileCount = 0;

  for await (const [name, childHandle] of handle.entries()) {
    scannedEntryCount += 1;

    if (childHandle.kind === 'file' && zodIs(name, zodAutomergeFileName)) {
      automergeFileCount += 1;
    } else {
      ordinaryEntryCount += 1;
    }

    if (scannedEntryCount >= MAX_SCANNED_ENTRIES) {
      break;
    }
  }

  return {
    isEmpty: scannedEntryCount === 0,
    looksLikeExistingSpace: automergeFileCount > 0,
    looksRiskyByName: isRiskyMioframeSpaceFolderName(handle.name),
    looksLargeAndOrdinary: ordinaryEntryCount >= MANY_ORDINARY_ENTRIES_THRESHOLD,
    scannedEntryCount,
  };
};
