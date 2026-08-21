import type { AMDocumentId } from '@shared/lib/automerge';
import type { DirectoryEntry } from '../fileSystem/fileSystemContracts';

export { RepositoryImportErrorCode } from './repositoryImportErrorCode';

/**
 * One classified directory entry as produced by the repository derivation coordinator.
 * The repository storage marker is never published as an entry; it only contributes to
 * `RepositorySnapshot.isInitialized`.
 */
export type RepositoryEntry = {
  /** The underlying name+stat directory entry. */
  entry: DirectoryEntry;
  /**
   * `automergeStorageCandidate` marks a plausible Automerge storage filename. It reflects filename
   * classification only — it does not claim that a v3 wrapper decoded successfully.
   */
  classification: 'regular' | 'automergeStorageCandidate';
};

/** Atomic repository facts and classified entries derived from one accepted directory snapshot. */
export type RepositorySnapshot = {
  /** Unique document ids currently visible through repository storage files. */
  documentIds: AMDocumentId[];
  /** Whether repository storage has been initialized for the folder. */
  isInitialized: boolean;
  /** Classified non-marker directory entries. */
  entries: readonly RepositoryEntry[];
};

/**
 * Reactive repository derivation state owned by the repository derivation coordinator
 * (`repositoryState.ts`). `refreshing` retains the previous snapshot so consumers never need to
 * fall back to a loading/spinner state while a fresh derivation is in flight.
 */
export type RepositoryState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: RepositorySnapshot }
  | { status: 'refreshing'; snapshot: RepositorySnapshot }
  | { status: 'error'; error: Error };
