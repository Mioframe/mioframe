import { zodDocumentId } from '@shared/lib/automerge';
import { describe, expect, it } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import { deriveMioframeSpaceDirectoryViewState } from './deriveMioframeSpaceDirectoryViewState';

const createStat = (type: FSNodeType): FSNodeStat => ({
  type,
  capabilities: {},
});

const documentId = zodDocumentId.parse('4Z1fFANPScpDsLXmC1KsBCn4mWYu');

describe('deriveMioframeSpaceDirectoryViewState', () => {
  it('stays loading until both directory and document reads are ready', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [['Notes', createStat(FSNodeType.Directory)]],
        documentIds: undefined,
        isDirectoryLoading: false,
        isRepositoryLoading: true,
      }),
    ).toEqual({
      status: 'loading',
    });
  });

  it('prioritizes directory errors over repository errors', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryErrorMessage: 'Could not read this folder',
        repositoryErrorMessage: 'Could not load the Mioframe documents in this folder',
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'error',
      message: 'Could not read this folder',
    });
  });

  it('returns repository errors after the directory read succeeds', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [['Notes', createStat(FSNodeType.Directory)]],
        repositoryErrorMessage: 'Could not load the Mioframe documents in this folder',
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'error',
      message: 'Could not load the Mioframe documents in this folder',
    });
  });

  it('returns a regular folder only when the marker is absent and no documents are detected', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [['Notes', createStat(FSNodeType.Directory)]],
        documentIds: [],
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'ready',
      folderState: 'regularFolder',
      documentIds: [],
      visibleFileEntries: [['Notes', createStat(FSNodeType.Directory)]],
    });
  });

  it('classifies folders with documents as mioframe spaces even without marker file', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [['Notes', createStat(FSNodeType.Directory)]],
        documentIds: [documentId],
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'ready',
      folderState: 'mioframeSpaceWithDocuments',
      documentIds: [documentId],
      visibleFileEntries: [['Notes', createStat(FSNodeType.Directory)]],
    });
  });

  it('returns an empty space when the marker exists without user-facing documents', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [[storageAdapterMarkerFileName, createStat(FSNodeType.File)]],
        documentIds: [],
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'ready',
      folderState: 'emptyMioframeSpace',
      documentIds: [],
      visibleFileEntries: [],
    });
  });

  it('returns a Mioframe space with documents when the marker and document ids exist', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [
          [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
          ['Notes', createStat(FSNodeType.Directory)],
        ],
        documentIds: [documentId],
        isDirectoryLoading: false,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'ready',
      folderState: 'mioframeSpaceWithDocuments',
      documentIds: [documentId],
      visibleFileEntries: [['Notes', createStat(FSNodeType.Directory)]],
    });
  });

  it('keeps independent loading branches explicit until both reads finish', () => {
    expect(
      deriveMioframeSpaceDirectoryViewState({
        directoryEntries: [['Notes', createStat(FSNodeType.Directory)]],
        documentIds: [documentId],
        isDirectoryLoading: false,
        isRepositoryLoading: true,
      }),
    ).toEqual({
      status: 'loading',
    });

    expect(
      deriveMioframeSpaceDirectoryViewState({
        documentIds: [documentId],
        isDirectoryLoading: true,
        isRepositoryLoading: false,
      }),
    ).toEqual({
      status: 'loading',
    });
  });
});
