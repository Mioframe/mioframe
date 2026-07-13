/**
 * Stable error codes for the storage-agnostic ZIP archive boundary (path safety and codec).
 */
export enum ZipArchiveErrorCode {
  unsafeEntryPath = 'zipArchive.unsafeEntryPath',
  archiveDamaged = 'zipArchive.archiveDamaged',
}
