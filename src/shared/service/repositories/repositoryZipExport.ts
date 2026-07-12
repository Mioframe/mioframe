import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { FSNodeType, PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  createZipArchiveWriter,
  streamBlobChunks,
  type ZipArchiveWriter,
} from '@shared/lib/zipArchive';
import { getDocumentStorageFiles } from './repositoryStorageFiles';
import {
  RepositoryZipErrorCode,
  type OnZipExportChunk,
  type OnZipExportProgress,
} from './repositoryZipContracts';
import { isZipProgressCountDue } from './repositoryZipProgress';

const writeDirectoryEntriesRecursively = async (
  vfs: VirtualFileSystem,
  writer: ZipArchiveWriter,
  directoryPath: string,
  archivePath: string,
  progressState: { current: number },
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  const directoryEntries = await vfs.readDirectory(directoryPath);

  if (directoryEntries.length === 0) {
    // The archive root itself (`archivePath === ''`) has no directory entry of its own — an empty
    // selected directory then produces a valid, empty ZIP archive with no entries at all.
    if (archivePath) {
      await writer.writeDirectoryEntry(archivePath);
    }
    return;
  }

  for (const [name, stat] of directoryEntries) {
    const childPath = PathUtils.join(directoryPath, name);
    const childArchivePath = archivePath ? `${archivePath}/${name}` : name;

    if (stat.type === FSNodeType.Directory) {
      // eslint-disable-next-line no-await-in-loop -- recursive tree walk stays ordered per directory
      await writeDirectoryEntriesRecursively(
        vfs,
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
      if (isZipProgressCountDue(progressState.current, undefined)) {
        // eslint-disable-next-line no-await-in-loop -- progress delivery is awaited to bound concurrent worker RPC requests
        await onProgress?.({ phase: 'reading', current: progressState.current });
      }
    }
  }
};

/**
 * Streams a ZIP archive of a directory's raw storage contents, including internal Mioframe
 * storage files such as `.mf` chunks and repository marker files. Archive entry paths are
 * relative to the selected directory itself — the archive has no wrapper folder named after the
 * exported directory, so its contents land directly at archive root. Callers are responsible for
 * settling any cached repository state under `path` before calling this, so the export reflects
 * the latest document state.
 *
 * Reads and packs one file at a time and delivers packed bytes through `onChunk` as they become
 * available, so the archive is never held in memory as one contiguous buffer.
 * @param vfs - Mounted virtual file system.
 * @param path - Absolute path to the directory to export.
 * @param onChunk - Invoked with each packed archive chunk as it becomes available.
 * @param onProgress - Optional progress callback for the preparing/reading/packing phases.
 * @returns Promise that resolves once every entry has been written and the archive is finalized.
 */
export const exportDirectoryZip = async (
  vfs: VirtualFileSystem,
  path: string,
  onChunk: OnZipExportChunk,
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  await onProgress?.({ phase: 'preparing' });

  const writer = createZipArchiveWriter((chunk) => onChunk(chunk));

  const progressState = { current: 0 };
  await onProgress?.({ phase: 'reading', current: 0 });
  await writeDirectoryEntriesRecursively(vfs, writer, path, '', progressState, onProgress);
  if (!isZipProgressCountDue(progressState.current, undefined)) {
    await onProgress?.({ phase: 'reading', current: progressState.current });
  }

  await onProgress?.({ phase: 'packing' });

  await writer.end();
};

/**
 * Streams a ZIP archive of one document's storage files, written directly at archive root using
 * their storage file names — the archive is not wrapped in a folder named after the document's
 * technical id. This reads raw storage files, not the decoded document state — it is not a JSON
 * snapshot. Callers are responsible for settling any cached repository state at `path` before
 * calling this, so the export reflects the latest document state.
 *
 * Reads and packs one file at a time and delivers packed bytes through `onChunk` as they become
 * available, so the archive is never held in memory as one contiguous buffer.
 * @param vfs - Mounted virtual file system.
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
  path: string,
  documentId: AMDocumentId,
  onChunk: OnZipExportChunk,
  onProgress?: OnZipExportProgress,
): Promise<void> => {
  await onProgress?.({ phase: 'preparing' });

  const documentStorageFiles = await getDocumentStorageFiles(vfs, path, documentId);

  if (documentStorageFiles.length === 0) {
    throw new DomainError('The document has no storage files to export.', {
      code: RepositoryZipErrorCode.documentStorageFilesNotFound,
    });
  }

  const writer = createZipArchiveWriter((chunk) => onChunk(chunk));
  const total = documentStorageFiles.length;
  let current = 0;
  await onProgress?.({ phase: 'reading', current: 0, total });

  for (const [name] of documentStorageFiles) {
    // eslint-disable-next-line no-await-in-loop -- sequential reads keep progress reporting simple
    const file = await vfs.readFile(PathUtils.join(path, name));
    // eslint-disable-next-line no-await-in-loop -- sequential writes keep archive entry order stable
    await writer.writeFileEntry(name, streamBlobChunks(file));
    current += 1;
    if (isZipProgressCountDue(current, total)) {
      // eslint-disable-next-line no-await-in-loop -- progress delivery is awaited to bound concurrent worker RPC requests
      await onProgress?.({ phase: 'reading', current, total });
    }
  }

  await onProgress?.({ phase: 'packing' });

  await writer.end();
};
