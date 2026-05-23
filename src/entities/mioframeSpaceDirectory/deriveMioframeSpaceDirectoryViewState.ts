import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  MioframeDirectoryEntry,
  MioframeSpaceDirectoryState,
} from './classifyMioframeSpaceDirectory';
import { classifyMioframeSpaceDirectory } from './classifyMioframeSpaceDirectory';

export type MioframeSpaceDirectoryReadyState = {
  status: 'ready';
  folderState: MioframeSpaceDirectoryState;
  documentIds: readonly AMDocumentId[];
  visibleFileEntries: readonly MioframeDirectoryEntry[];
};

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
}: {
  directoryEntries?: readonly MioframeDirectoryEntry[] | undefined;
  directoryErrorMessage?: string | undefined;
  documentIds?: readonly AMDocumentId[] | undefined;
  repositoryErrorMessage?: string | undefined;
  isDirectoryLoading: boolean;
  isRepositoryLoading: boolean;
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
  });

  return {
    status: 'ready',
    folderState: presentation.state,
    documentIds: presentation.hasMarkerFile ? documentIds : [],
    visibleFileEntries: presentation.visibleFileEntries,
  };
};
