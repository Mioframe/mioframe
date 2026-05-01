import type { AMDocumentId } from '@shared/lib/automerge';
import { fileNameToPartialKey } from '@shared/lib/automergeAdapter';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  type VirtualFileSystem,
  VfsError,
} from '@shared/lib/virtualFileSystem';

/** Delay between cleanup passes so late Automerge storage writes can surface before the next scan. */
export const DOCUMENT_DELETE_CLEANUP_RETRY_DELAY_MS = 50;
/** Maximum number of sequential cleanup passes after document deletion. */
export const DOCUMENT_DELETE_CLEANUP_MAX_ATTEMPTS = 8;
/** Number of consecutive empty scans required before cleanup is considered stable. */
export const DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED = 2;

/**
 * Lists Automerge storage files that belong to one document inside a repository directory.
 *
 * @param vfs Mounted virtual file system used by the repository storage adapter
 * @param path Absolute repository directory path
 * @param id Target Automerge document id
 * @returns Matching storage file entries for the target document
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
 * Removes all currently visible Automerge storage files for one document.
 * Missing files are treated as already removed because Automerge may race with the cleanup pass.
 *
 * @param vfs Mounted virtual file system used by the repository storage adapter
 * @param path Absolute repository directory path
 * @param id Target Automerge document id
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
 *
 * @param vfs Mounted virtual file system used by the repository storage adapter
 * @param path Absolute repository directory path
 * @param id Target Automerge document id
 * @throws Error when storage files still remain after all cleanup attempts
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
    const remainingFileNames = remainingStorageFiles.map(([name]) => name).join(', ');

    throw new Error(
      `Failed to cleanup deleted document storage files at "${path}" for document "${id}". Remaining files: ${remainingStorageFiles.length}. ${remainingFileNames}`,
    );
  }

  console.warn(
    `Deleted document storage cleanup at "${path}" for document "${id}" finished without ${DOCUMENT_DELETE_CLEANUP_EMPTY_PASSES_REQUIRED} confirmed empty passes`,
  );
};
