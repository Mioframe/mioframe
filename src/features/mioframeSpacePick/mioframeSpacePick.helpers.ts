import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import { zodIs } from '@shared/lib/validateZodScheme';

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

/**
 * Summary of the bounded folder scan used by Mioframe space selection.
 */
export type MioframeSpaceInspection = {
  /** Whether the scan observed no entries. */
  isEmpty: boolean;
  /** Whether the folder contains existing Mioframe service files. */
  looksLikeExistingSpace: boolean;
  /** Whether the visible folder name is a broad common user folder. */
  looksRiskyByName: boolean;
  /** Whether the bounded scan found many non-service entries. */
  looksLargeAndOrdinary: boolean;
  /** Number of non-service entries encountered during the bounded scan. */
  ordinaryEntryCount: number;
  /** Total number of scanned entries before the scan completed or stopped. */
  scannedEntryCount: number;
};

/**
 * Returns whether the selected folder name commonly represents a broad user folder.
 * @param name - User-visible folder name reported by the picker handle.
 * @returns Whether the folder name should be treated as risky for a new space.
 */
export const isRiskyMioframeSpaceFolderName = (name: string) =>
  RISKY_FOLDER_NAMES.has(name.trim().toLowerCase());

/**
 * Inspects the visible entries of a picked folder to decide whether it already looks like a Mioframe space.
 * @param handle - Folder handle selected by the user.
 * @returns Summary of the bounded folder inspection.
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
    ordinaryEntryCount,
    scannedEntryCount,
  };
};
