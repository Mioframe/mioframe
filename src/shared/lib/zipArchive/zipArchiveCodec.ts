import { unzipSync, zipSync } from 'fflate';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';

/** Flat map of archive entry paths to their raw bytes. Keys ending in `/` are directory markers. */
export type ZipArchiveEntries = Record<string, Uint8Array<ArrayBuffer>>;

/**
 * Packs a flat map of entry paths and bytes into a ZIP archive.
 * @param entries - Archive entries keyed by their relative path (directory markers end in `/`).
 * @returns The packed ZIP archive bytes.
 */
export const packZipArchive = (entries: ZipArchiveEntries): Uint8Array<ArrayBuffer> =>
  zipSync(entries, { level: 6 });

/**
 * Unpacks a ZIP archive into a flat map of entry paths and bytes.
 * @param archiveBytes - Raw bytes of a ZIP archive, e.g. read from a user-selected file.
 * @returns The archive's entries keyed by their raw recorded path.
 * @throws DomainError with code `ZipArchiveErrorCode.archiveDamaged` when the archive is damaged
 * or not a supported ZIP structure.
 */
export const unpackZipArchive = (archiveBytes: Uint8Array): ZipArchiveEntries => {
  try {
    return unzipSync(archiveBytes);
  } catch (error) {
    throw new DomainError('The archive is damaged or not a supported ZIP file.', {
      cause: error,
      code: ZipArchiveErrorCode.archiveDamaged,
    });
  }
};
