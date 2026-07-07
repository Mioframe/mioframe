import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { FSNodeType, PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  createZipArchiveWriter,
  sanitizeArchiveRootName,
  streamBlobChunks,
  type ZipArchiveWriter,
} from '@shared/lib/zipArchive';
import { getDocumentStorageFiles } from './repositoryStorageFiles';
import {
  RepositoryZipErrorCode,
  type OnZipExportChunk,
  type OnZipExportProgress,
} from './repositoryZipContracts';

/**
 * Flushes pending Automerge saves for the repository rooted at `path`, if one exists.
 * When `documentIds` is omitted, every document currently loaded for that repository is flushed.
 */
export type FlushRepositoryPath = (path: string, documentIds?: AMDocumentId[]) => Promise<void>;

const writeDirectoryEntriesRecursively = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  writer: ZipArchiveWriter,
  directoryPath: string,
  archivePath: string,
  progressState: { current: number },
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  await flushRepositoryPath(directoryPath);

  const directoryEntries = await vfs.readDirectory(directoryPath);

  if (directoryEntries.length === 0) {
    await writer.writeDirectoryEntry(archivePath);
    return;
  }

  for (const [name, stat] of directoryEntries) {
    const childPath = PathUtils.join(directoryPath, name);
    const childArchivePath = `${archivePath}/${name}`;

    if (stat.type === FSNodeType.Directory) {
      // eslint-disable-next-line no-await-in-loop -- recursive tree walk stays ordered per directory
      await writeDirectoryEntriesRecursively(
        vfs,
        flushRepositoryPath,
        writer,
        childPath,
        childArchivePath,
        progressState,
        onProgress,
      );
    } else {
      // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
      const file = await vfs.readFile(childPath);
      // eslint-disable-next-line no-await-in-loop -- sequential writes keep archive entry order stable
      await writer.writeFileEntry(childArchivePath, streamBlobChunks(file));
      progressState.current += 1;
      onProgress?.({ phase: 'reading', current: progressState.current });
    }
  }
};

/**
 * Streams a ZIP archive of a directory's raw storage contents, including internal Mioframe
 * storage files such as `.mf` chunks and repository marker files. Flushes each nested
 * repository's pending Automerge saves before reading its storage files so the export reflects
 * the latest document state.
 *
 * Reads and packs one file at a time and delivers packed bytes through `onChunk` as they become
 * available, so the archive is never held in memory as one contiguous buffer.
 * @param vfs - Mounted virtual file system.
 * @param flushRepositoryPath - Flushes pending Automerge saves for the repository at a path.
 * @param path - Absolute path to the directory to export.
 * @param onChunk - Invoked with each packed archive chunk as it becomes available.
 * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
 * @returns Promise that resolves once every entry has been written and the archive is finalized.
 */
export const exportDirectoryZip = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  path: string,
  onChunk: OnZipExportChunk,
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  onProgress?.({ phase: 'preparing' });

  const archiveRoot = sanitizeArchiveRootName(PathUtils.basename(path), 'root');
  const writer = createZipArchiveWriter(onChunk);

  await writeDirectoryEntriesRecursively(
    vfs,
    flushRepositoryPath,
    writer,
    path,
    archiveRoot,
    { current: 0 },
    onProgress,
  );

  onProgress?.({ phase: 'packing' });

  await writer.end();
};

/**
 * Streams a ZIP archive of one document's storage files, in a folder-like archive layout rooted
 * at the document id. Flushes the document's pending Automerge saves before reading storage
 * files so the export reflects the latest document state. This reads raw storage files, not the
 * decoded document state — it is not a JSON snapshot.
 *
 * Reads and packs one file at a time and delivers packed bytes through `onChunk` as they become
 * available, so the archive is never held in memory as one contiguous buffer.
 * @param vfs - Mounted virtual file system.
 * @param flushRepositoryPath - Flushes pending Automerge saves for the repository at a path.
 * @param path - Absolute path to the directory containing the document.
 * @param documentId - Target document id.
 * @param onChunk - Invoked with each packed archive chunk as it becomes available.
 * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
 * @returns Promise that resolves once every entry has been written and the archive is finalized.
 * @throws DomainError with code `RepositoryZipErrorCode.documentStorageFilesNotFound` when the
 * document has no storage files in the given directory.
 */
export const exportDocumentZip = async (
  vfs: VirtualFileSystem,
  flushRepositoryPath: FlushRepositoryPath,
  path: string,
  documentId: AMDocumentId,
  onChunk: OnZipExportChunk,
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  onProgress?.({ phase: 'preparing' });

  await flushRepositoryPath(path, [documentId]);

  const documentStorageFiles = await getDocumentStorageFiles(vfs, path, documentId);

  if (documentStorageFiles.length === 0) {
    throw new DomainError('The document has no storage files to export.', {
      code: RepositoryZipErrorCode.documentStorageFilesNotFound,
    });
  }

  const writer = createZipArchiveWriter(onChunk);
  let current = 0;

  for (const [name] of documentStorageFiles) {
    // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
    const file = await vfs.readFile(PathUtils.join(path, name));
    // eslint-disable-next-line no-await-in-loop -- sequential writes keep archive entry order stable
    await writer.writeFileEntry(`${documentId}/${name}`, streamBlobChunks(file));
    current += 1;
    onProgress?.({ phase: 'reading', current, total: documentStorageFiles.length });
  }

  onProgress?.({ phase: 'packing' });

  await writer.end();
};
