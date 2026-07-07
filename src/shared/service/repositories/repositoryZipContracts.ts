/** Progress phases reported while a service-owned ZIP export builds an archive. */
export type ZipExportPhase = 'preparing' | 'reading' | 'packing';

/** Progress reported by a service-owned ZIP export operation. */
export type ZipExportProgress = {
  /** Current export phase. */
  phase: ZipExportPhase;
  /** Number of storage files processed so far, when known. */
  current?: number;
  /** Total number of storage files to process, when known. */
  total?: number;
};

/** Callback invoked with export progress updates as the service builds the archive. */
export type OnZipExportProgress = (progress: ZipExportProgress) => void;

/**
 * Callback invoked with one packed archive chunk as a service-owned ZIP export produces it, so
 * the caller can write it out (e.g. to a save-picker writable) without the service holding the
 * full archive in memory.
 */
export type OnZipExportChunk = (chunk: Uint8Array, final: boolean) => void | Promise<void>;

/** Progress phases reported while a service-owned ZIP import validates and writes an archive. */
export type ZipImportPhase = 'validatingArchive' | 'checkingConflicts' | 'unpacking';

/** Progress reported by a service-owned ZIP import operation. */
export type ZipImportProgress = {
  /** Current import phase. */
  phase: ZipImportPhase;
  /** Number of entries processed so far, when known. */
  current?: number;
  /** Total number of entries to process, when known. */
  total?: number;
};

/** Callback invoked with import progress updates as the service validates and writes files. */
export type OnZipImportProgress = (progress: ZipImportProgress) => void;

/**
 * Stable error codes for repository ZIP export/import failures.
 * Archive structure failures (damaged archive, unsafe entry path) use `ZipArchiveErrorCode`
 * from `@shared/lib/zipArchive` instead, since that boundary detects them.
 */
export enum RepositoryZipErrorCode {
  documentStorageFilesNotFound = 'repositories.zipDocumentStorageFilesNotFound',
  importConflict = 'repositories.zipImportConflict',
  /**
   * A ZIP import write failed after at least one earlier write in the same import already
   * succeeded. Unlike `importConflict`, the target directory may now hold a partial import.
   */
  importWritePartiallyFailed = 'repositories.zipImportWritePartiallyFailed',
}
