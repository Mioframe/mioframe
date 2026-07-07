import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { FSNodeType, PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  packZipArchive,
  sanitizeArchiveRootName,
  type ZipArchiveEntries,
} from '@shared/lib/zipArchive';
import { getDocumentStorageFiles } from './repositoryStorageFiles';
import { RepositoryZipErrorCode, type OnZipExportProgress } from './repositoryZipContracts';

/**
 * Flushes pending Automerge saves for the repository rooted at `path`, if one exists.
 * When `documentIds` is omitted, every document currently loaded for that repository is flushed.
 */
export type FlushRepositoryPath = (path: string, documentIds?: AMDocumentId[]) => Promise<void>;

const readDirectoryEntriesRecursively = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  directoryPath: string,
  archivePath: string,
  entries: ZipArchiveEntries,
  progressState: { current: number },
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  await flushRepositoryPath(directoryPath);

  const directoryEntries = await vfs.readDirectory(directoryPath);

  if (directoryEntries.length === 0) {
    entries[`${archivePath}/`] = new Uint8Array(0);
    return;
  }

  for (const [name, stat] of directoryEntries) {
    const childPath = PathUtils.join(directoryPath, name);
    const childArchivePath = `${archivePath}/${name}`;

    if (stat.type === FSNodeType.Directory) {
      // eslint-disable-next-line no-await-in-loop -- recursive tree walk stays ordered per directory
      await readDirectoryEntriesRecursively(
        vfs,
        flushRepositoryPath,
        childPath,
        childArchivePath,
        entries,
        progressState,
        onProgress,
      );
    } else {
      // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
      const file = await vfs.readFile(childPath);
      // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
      entries[childArchivePath] = new Uint8Array(await file.arrayBuffer());
      progressState.current += 1;
      onProgress?.({ phase: 'reading', current: progressState.current });
    }
  }
};

/**
 * Builds a ZIP archive of a directory's raw storage contents, including internal Mioframe
 * storage files such as `.mf` chunks and repository marker files. Flushes each nested
 * repository's pending Automerge saves before reading its storage files so the export reflects
 * the latest document state.
 * @param vfs - Mounted virtual file system.
 * @param flushRepositoryPath - Flushes pending Automerge saves for the repository at a path.
 * @param path - Absolute path to the directory to export.
 * @param onProgress - Optional progress callback for the reading/packing phases.
 * @returns The packed ZIP archive bytes.
 */
export const exportDirectoryZip = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  path: string,
  onProgress?: OnZipExportProgress,
): Promise<Uint8Array> => {
  onProgress?.({ phase: 'preparing' });

  const archiveRoot = sanitizeArchiveRootName(PathUtils.basename(path), 'root');
  const entries: ZipArchiveEntries = {};

  await readDirectoryEntriesRecursively(
    vfs,
    flushRepositoryPath,
    path,
    archiveRoot,
    entries,
    { current: 0 },
    onProgress,
  );

  onProgress?.({ phase: 'packing' });

  return packZipArchive(entries);
};

/**
 * Builds a ZIP archive of one document's storage files, in a folder-like archive layout rooted
 * at the document id. Flushes the document's pending Automerge saves before reading storage
 * files so the export reflects the latest document state. This reads raw storage files, not the
 * decoded document state — it is not a JSON snapshot.
 * @param vfs - Mounted virtual file system.
 * @param flushRepositoryPath - Flushes pending Automerge saves for the repository at a path.
 * @param path - Absolute path to the directory containing the document.
 * @param documentId - Target document id.
 * @param onProgress - Optional progress callback for the reading/packing phases.
 * @returns The packed ZIP archive bytes.
 * @throws DomainError with code `RepositoryZipErrorCode.documentStorageFilesNotFound` when the
 * document has no storage files in the given directory.
 */
export const exportDocumentZip = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  path: string,
  documentId: AMDocumentId,
  onProgress?: OnZipExportProgress,
): Promise<Uint8Array> => {
  onProgress?.({ phase: 'preparing' });

  await flushRepositoryPath(path, [documentId]);

  const documentStorageFiles = await getDocumentStorageFiles(vfs, path, documentId);

  if (documentStorageFiles.length === 0) {
    throw new DomainError('The document has no storage files to export.', {
      code: RepositoryZipErrorCode.documentStorageFilesNotFound,
    });
  }

  const entries: ZipArchiveEntries = {};
  let current = 0;

  for (const [name] of documentStorageFiles) {
    // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
    const file = await vfs.readFile(PathUtils.join(path, name));
    // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
    entries[`${documentId}/${name}`] = new Uint8Array(await file.arrayBuffer());
    current += 1;
    onProgress?.({ phase: 'reading', current, total: documentStorageFiles.length });
  }

  onProgress?.({ phase: 'packing' });

  return packZipArchive(entries);
};
