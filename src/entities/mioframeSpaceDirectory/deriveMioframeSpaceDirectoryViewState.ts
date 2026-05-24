import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  MioframeDirectoryEntry,
  MioframeSpaceDirectoryState,
} from './classifyMioframeSpaceDirectory';
import { classifyMioframeSpaceDirectory } from './classifyMioframeSpaceDirectory';

/**
 * Ready repository explorer state after directory and repository reads have both succeeded.
 */
export type MioframeSpaceDirectoryReadyState = {
  /** View state discriminator for successful explorer reads. */
  status: 'ready';
  /** Classified Mioframe folder state for the current directory. */
  folderState: MioframeSpaceDirectoryState;
  /** Repository document ids that remain visible in the Documents section. */
  documentIds: readonly AMDocumentId[];
  /** Non-document file entries that remain visible in the Files section. */
  visibleFileEntries: readonly MioframeDirectoryEntry[];
};

/**
 * User-facing state for the split repository explorer documents/files surface.
 */
export type MioframeSpaceDirectoryViewState =
  | {
      status: 'loading';
    }
  | {
      status: 'error';
      message: string;
    }
  | MioframeSpaceDirectoryReadyState;

/**
 * Derives the user-facing folder screen view state from directory and document reads.
 * @param params - Loading, error, and data inputs needed by the folder screen.
 * @returns A loading, error, or coherent ready state for the split explorer UI.
 */
export const deriveMioframeSpaceDirectoryViewState = ({
  directoryEntries,
  directoryErrorMessage,
  documentIds,
  repositoryErrorMessage,
  isDirectoryLoading,
  isRepositoryLoading,
  hideAutomergeFiles = true,
}: {
  directoryEntries?: readonly MioframeDirectoryEntry[] | undefined;
  directoryErrorMessage?: string | undefined;
  documentIds?: readonly AMDocumentId[] | undefined;
  repositoryErrorMessage?: string | undefined;
  isDirectoryLoading: boolean;
  isRepositoryLoading: boolean;
  hideAutomergeFiles?: boolean | undefined;
}): MioframeSpaceDirectoryViewState => {
  if (directoryErrorMessage) {
    return {
      status: 'error',
      message: directoryErrorMessage,
    };
  }

  if (repositoryErrorMessage) {
    return {
      status: 'error',
      message: repositoryErrorMessage,
    };
  }

  if (isDirectoryLoading || isRepositoryLoading || !directoryEntries || !documentIds) {
    return {
      status: 'loading',
    };
  }

  const presentation = classifyMioframeSpaceDirectory({
    directoryEntries,
    documentIds,
    hideAutomergeFiles,
  });

  return {
    status: 'ready',
    folderState: presentation.state,
    documentIds,
    visibleFileEntries: presentation.visibleFileEntries,
  };
};
