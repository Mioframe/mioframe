import type { AMDocumentId } from '@shared/lib/automerge';
import {
  collectStorageFileNamesForPrefix,
  discoverStorageDocumentIds,
  isPlausibleRepositoryStorageCandidateFileName as isPlausibleStorageCandidateFileName,
  storageAdapterMarkerFileName,
  type ReadOnlyStorageFilePolicyIo,
} from '@shared/lib/automergeAdapter';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  type VirtualFileSystem,
  VfsError,
} from '@shared/lib/virtualFileSystem';
import type { RepositoryDirectoryEntry } from './repositoryContracts';

/** Low-level repository facts derived from one directory listing. */
export type RepositoryFacts = {
  /** Unique document ids currently visible through repository storage files. */
  documentIds: AMDocumentId[];
  /** Whether repository storage has been initialized for the folder. */
  isInitialized: boolean;
};

/** Delay between cleanup passes so late Automerge storage writes can surface before the next scan. */
export const DOCUMENT_DELETE_CLEANUP_RETRY_DELAY_MS = 50;
/** Maximum number of sequential cleanup passes after document deletion. */
export const DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS = 8;
/** Number of consecutive empty scans required before cleanup is considered stable. */
export const DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED = 2;

/**
 * Lists Automerge storage files that belong to one document inside a repository directory.
 * @param vfs - Mounted virtual file system used by the repository storage adapter.
 * @param path - Absolute repository directory path.
 * @param id - Target Automerge document id.
 * @returns Matching storage file entries for the target document.
 */
export const getDocumentStorageFiles = async (
  vfs: VirtualFileSystem,
  path: string,
  id: AMDocumentId,
) => {
  const entries = await vfs.readDirectory(path);
  const fileEntries = entries.filter(([, stat]) => stat.type === FSNodeType.File);
  const names = new Set(
    await collectStorageFileNamesForPrefix(createRepositoryStorageIo(vfs, path, fileEntries), [id]),
  );

  return fileEntries.filter(([name]) => names.has(name));
};

/**
 * Returns whether a file name is the repository storage marker file.
 * @param name - File name to classify.
 * @returns Whether the file name is the repository storage marker file.
 */
export const isRepositoryMarkerFileName = (name: string) => name === storageAdapterMarkerFileName;

/**
 * Returns whether a file name is a plausible repository storage candidate file.
 * For v3 `.mf`, filename matching is only a discovery prefilter; full identity still comes from
 * decoding the wrapper payload.
 * @param name - File name to classify.
 * @returns Whether the file name is a repository storage candidate file.
 */
export const isRepositoryStorageCandidateFileName = (name: string) =>
  isPlausibleStorageCandidateFileName(name);

/**
 * @deprecated Use `isRepositoryStorageCandidateFileName` instead. This alias is kept only for
 * compatibility.
 */
export const isRepositoryStorageCandidateDocumentFileName = isRepositoryStorageCandidateFileName;

/**
 * @deprecated Use `isRepositoryStorageCandidateFileName` instead. This alias is kept only for
 * compatibility.
 */
export const isAutomergeDocumentFileName = isRepositoryStorageCandidateFileName;

/**
 * Returns whether a repository storage file should stay hidden in the file list.
 * @param name - File name to classify.
 * @param hideAutomergeFiles - Whether Automerge document files should stay hidden.
 * @returns Whether the repository storage file should stay hidden in the file list.
 */
export const shouldHideRepositoryStorageFile = (name: string, hideAutomergeFiles: boolean) =>
  isRepositoryMarkerFileName(name) ||
  (hideAutomergeFiles && isRepositoryStorageCandidateFileName(name));

/**
 * Returns directory entries visible to the user after repository storage files are filtered out.
 * @param directoryEntries - Directory entries in the current folder.
 * @param hideAutomergeFiles - Whether Automerge document files should stay hidden.
 * @returns Directory entries visible to the user.
 */
export const getRegularDirectoryEntries = (
  directoryEntries: readonly RepositoryDirectoryEntry[],
  hideAutomergeFiles = true,
): readonly RepositoryDirectoryEntry[] =>
  directoryEntries.filter(([name]) => !shouldHideRepositoryStorageFile(name, hideAutomergeFiles));

/**
 * Derives low-level repository facts for one repository directory.
 * @param vfs - Mounted virtual file system used to decode wrapper-backed storage files.
 * @param path - Absolute repository directory path.
 * @param directoryEntries - Optional pre-read directory entries for the current folder.
 * @returns Repository initialization and document-id facts derived from the directory listing.
 */
export const getRepositoryFacts = async (
  vfs: VirtualFileSystem,
  path: string,
  directoryEntries?: readonly RepositoryDirectoryEntry[],
): Promise<RepositoryFacts> => {
  const entries = directoryEntries ?? (await vfs.readDirectory(path));
  const fileEntries = entries.filter(([, stat]) => stat.type === FSNodeType.File);
  const isInitialized = fileEntries.some(([name]) => isRepositoryMarkerFileName(name));
  const documentIds = await discoverStorageDocumentIds(
    createRepositoryStorageIo(vfs, path, fileEntries),
  );

  return {
    documentIds,
    isInitialized: isInitialized || documentIds.length > 0,
  };
};

/**
 * Removes all currently visible Automerge storage files for one document.
 * Missing files are treated as already removed because Automerge may race with the cleanup pass.
 * @param vfs - Mounted virtual file system used by the repository storage adapter.
 * @param path - Absolute repository directory path.
 * @param id - Target Automerge document id.
 * @returns Promise that resolves when the visible storage files are removed.
 */
export const removeDocumentStorageFiles = async (
  vfs: VirtualFileSystem,
  path: string,
  id: AMDocumentId,
) => {
  const documentStorageFiles = await getDocumentStorageFiles(vfs, path, id);

  await Promise.all(
    documentStorageFiles.map(async ([name]) => {
      try {
        await vfs.delete(PathUtils.join(path, name));
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
          return;
        }

        throw error;
      }
    }),
  );
};

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const createRepositoryStorageIo = (
  vfs: VirtualFileSystem,
  path: string,
  entries: readonly RepositoryDirectoryEntry[],
): ReadOnlyStorageFilePolicyIo => {
  const fileNames = entries
    .filter(([, stat]) => stat.type === FSNodeType.File)
    .map(([name]) => name);

  return {
    listNames: () => Promise.resolve(fileNames),
    readBytes: async (name) => {
      try {
        const file = await vfs.readFile(PathUtils.join(path, name));
        return new Uint8Array(await file.arrayBuffer());
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.FileNotFound) {
          return undefined;
        }

        throw error;
      }
    },
  };
};

/**
 * Repeatedly removes storage files for a deleted document until the directory stays empty
 * for the required number of confirmation passes.
 * @param vfs - Mounted virtual file system used by the repository storage adapter.
 * @param path - Absolute repository directory path.
 * @param id - Target Automerge document id.
 * @returns Promise that resolves when cleanup reaches a stable empty state.
 * @throws Error when storage files still remain after all cleanup attempts.
 */
export const cleanupDeletedDocumentStorageFiles = async (
  vfs: VirtualFileSystem,
  path: string,
  id: AMDocumentId,
) => {
  let emptyPassCount = 0;

  for (let attempt = 0; attempt < DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- each pass must observe current storage state
    const documentStorageFiles = await getDocumentStorageFiles(vfs, path, id);

    if (documentStorageFiles.length === 0) {
      emptyPassCount += 1;

      if (emptyPassCount >= DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED) {
        return;
      }
    } else {
      emptyPassCount = 0;
      // eslint-disable-next-line no-await-in-loop -- deletion must finish before next scan
      await removeDocumentStorageFiles(vfs, path, id);
    }

    if (attempt < DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS - 1) {
      // eslint-disable-next-line no-await-in-loop -- wait lets late Automerge files appear before next pass
      await wait(DOCUMENT_DELETE_CLEANUP_RETRY_DELAY_MS);
    }
  }

  const remainingStorageFiles = await getDocumentStorageFiles(vfs, path, id);

  if (remainingStorageFiles.length > 0) {
    throw new Error('Failed to cleanup deleted document storage files');
  }

  console.warn('Deleted document storage cleanup finished without confirmed empty passes');
};
