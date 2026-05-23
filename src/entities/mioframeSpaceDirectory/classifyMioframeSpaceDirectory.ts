import { storageAdapterMarkerFileName, zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';

/** User-facing folder states for the opened Mioframe directory screen. */
export type MioframeSpaceDirectoryState =
  | 'regularFolder'
  | 'inconsistentMioframeData'
  | 'emptyMioframeSpace'
  | 'mioframeSpaceWithDocuments';

/** Directory entry contract consumed by the folder presentation classifier. */
export type MioframeDirectoryEntry = readonly [name: string, stat: FSNodeStat];

/** Derived presentation data for the split Mioframe-documents and files screen. */
export type MioframeSpaceDirectoryPresentation = {
  /** High-level folder state shown by the explorer screen. */
  state: MioframeSpaceDirectoryState;
  /** Whether the current folder already contains the Mioframe marker file. */
  hasMarkerFile: boolean;
  /** Files and folders that remain visible after Mioframe service files are hidden. */
  visibleFileEntries: readonly MioframeDirectoryEntry[];
};

const isMioframeServiceFile = (name: string) =>
  name === storageAdapterMarkerFileName || zodIs(name, zodAutomergeFileName);

/**
 * Classifies a folder into the Mioframe space states needed by the explorer screen.
 * @param params - Raw directory entries plus detected document ids.
 * @returns Folder state and the regular file entries that stay visible to the user.
 */
export const classifyMioframeSpaceDirectory = ({
  directoryEntries,
  documentIds,
}: {
  directoryEntries: readonly MioframeDirectoryEntry[];
  documentIds: readonly string[];
}): MioframeSpaceDirectoryPresentation => {
  const hasMarkerFile = directoryEntries.some(([name, stat]) => {
    return stat.type === FSNodeType.File && name === storageAdapterMarkerFileName;
  });

  const visibleFileEntries = directoryEntries.filter(([name]) => !isMioframeServiceFile(name));

  if (!hasMarkerFile) {
    return {
      state: documentIds.length > 0 ? 'inconsistentMioframeData' : 'regularFolder',
      hasMarkerFile,
      visibleFileEntries,
    };
  }

  return {
    state: documentIds.length > 0 ? 'mioframeSpaceWithDocuments' : 'emptyMioframeSpace',
    hasMarkerFile,
    visibleFileEntries,
  };
};
