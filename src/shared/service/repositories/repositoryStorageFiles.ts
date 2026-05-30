import { zodDocumentId, type AMDocumentId } from '@shared/lib/automerge';
import { fileNameToPartialKey, storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  type FSNodeStat,
  type VirtualFileSystem,
  VfsError,
} from '@shared/lib/virtualFileSystem';
import { zodIs } from '@shared/lib/validateZodScheme';

/** Directory entry contract used for repository storage inspection and file-list filtering. */
export type RepositoryDirectoryEntry = readonly [name: string, stat: FSNodeStat];

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

  return entries.filter(([name, stat]) => {
    if (stat.type !== FSNodeType.File) {
      return false;
    }

    return fileNameToPartialKey(name)?.at(0) === id;
  });
};

/**
 * Returns whether a file name is the repository storage marker file.
 * @param name - File name to classify.
 * @returns Whether the file name is the repository storage marker file.
 */
export const isRepositoryMarkerFileName = (name: string) => name === storageAdapterMarkerFileName;

/**
 * Returns whether a file name is an Automerge document storage file.
 * @param name - File name to classify.
 * @returns Whether the file name is an Automerge document storage file.
 */
export const isAutomergeDocumentFileName = (name: string) =>
  fileNameToPartialKey(name) !== undefined;

/**
 * Returns whether a repository storage file should stay hidden in the file list.
 * @param name - File name to classify.
 * @param hideAutomergeFiles - Whether Automerge document files should stay hidden.
 * @returns Whether the repository storage file should stay hidden in the file list.
 */
export const shouldHideRepositoryStorageFile = (name: string, hideAutomergeFiles: boolean) =>
  isRepositoryMarkerFileName(name) || (hideAutomergeFiles && isAutomergeDocumentFileName(name));

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
 * Derives low-level repository facts from one directory listing.
 * @param directoryEntries - Directory entries in the current folder.
 * @returns Repository initialization and document-id facts derived from the directory listing.
 */
export const getRepositoryFacts = (
  directoryEntries: readonly RepositoryDirectoryEntry[],
): RepositoryFacts =>
  directoryEntries.reduce<RepositoryFacts>(
    (facts, [name, stat]) => {
      if (stat.type !== FSNodeType.File) {
        return facts;
      }

      if (isRepositoryMarkerFileName(name)) {
        facts.isInitialized = true;
        return facts;
      }

      const [documentId] = fileNameToPartialKey(name) ?? [];

      if (zodIs(documentId, zodDocumentId) && !facts.documentIds.includes(documentId)) {
        facts.documentIds.push(documentId);
        facts.isInitialized = true;
      }

      return facts;
    },
    {
      documentIds: [],
      isInitialized: false,
    },
  );

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
