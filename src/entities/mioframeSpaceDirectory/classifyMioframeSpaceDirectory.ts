import { storageAdapterMarkerFileName, zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';

/** Stable Mioframe directory states derived from marker-file and document facts. */
export type MioframeSpaceDirectoryState =
  | 'regularFolder'
  | 'emptyMioframeSpace'
  | 'mioframeSpaceWithDocuments';

/** Directory entry contract consumed by Mioframe directory helpers. */
export type MioframeDirectoryEntry = readonly [name: string, stat: FSNodeStat];

/**
 * Returns whether a file name belongs to Mioframe service storage.
 * @param name - File name to classify.
 * @param hideAutomergeFiles - Whether Automerge document files should count as service files.
 * @returns Whether the file should be hidden as Mioframe service storage.
 */
export const isMioframeServiceFile = (name: string, hideAutomergeFiles: boolean) =>
  name === storageAdapterMarkerFileName ||
  (hideAutomergeFiles && zodIs(name, zodAutomergeFileName));

/**
 * Returns whether the current directory includes the Mioframe marker file as a file entry.
 * @param directoryEntries - Directory entries in the currently opened folder.
 * @returns Whether the folder contains the Mioframe marker file.
 */
export const hasMioframeMarkerFile = (directoryEntries: readonly MioframeDirectoryEntry[]) =>
  directoryEntries.some(([name, stat]) => {
    return stat.type === FSNodeType.File && name === storageAdapterMarkerFileName;
  });

/**
 * Derives the stable Mioframe directory state from marker-file and repository facts.
 * @param params - Marker-file and repository facts for the current folder.
 * @returns The stable Mioframe directory state.
 */
export const getMioframeSpaceDirectoryState = ({
  hasMarkerFile,
  documentIds,
}: {
  hasMarkerFile: boolean;
  documentIds: readonly string[];
}): MioframeSpaceDirectoryState => {
  if (documentIds.length > 0) {
    return 'mioframeSpaceWithDocuments';
  }

  if (hasMarkerFile) {
    return 'emptyMioframeSpace';
  }

  return 'regularFolder';
};

/**
 * Returns user-facing file entries after Mioframe service files are filtered out.
 * @param params - Directory entries plus the current Automerge visibility preference.
 * @returns Directory entries that remain visible to the user.
 */
export const getRegularDirectoryEntries = ({
  directoryEntries,
  hideAutomergeFiles = true,
}: {
  directoryEntries: readonly MioframeDirectoryEntry[];
  hideAutomergeFiles?: boolean | undefined;
}): readonly MioframeDirectoryEntry[] =>
  directoryEntries.filter(([name]) => !isMioframeServiceFile(name, hideAutomergeFiles));
