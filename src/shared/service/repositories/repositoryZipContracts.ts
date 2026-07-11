import { DomainError } from '@shared/lib/error';
import { zodIs } from '@shared/lib/validateZodScheme';
import * as z from 'zod/mini';

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

/** Conflict behavior selected for generic ZIP extraction. */
export type ZipImportConflictPolicy = 'abort' | 'skipExisting';

/** Explicit options for conflict handling during a generic ZIP import. */
export type ZipImportOptions = {
  /** Existing-target behavior; defaults to abort. */
  conflictPolicy?: ZipImportConflictPolicy;
};

/** Centrally owned safety limits for a generic ZIP import. */
export const ZIP_IMPORT_LIMITS = {
  maximumEntries: 10_000,
  maximumFileBytes: 128 * 1024 * 1024,
  maximumTotalBytes: 1024 * 1024 * 1024,
  maximumRelativePathLength: 1024,
  maximumPathDepth: 64,
} as const;

/** Bounded report returned for expected target conflicts. */
export type ZipImportConflictReport = {
  /** Total conflicting archive entries. */
  total: number;
  /** Bounded safe relative paths for display. */
  paths: string[];
  /** Whether additional conflicts were omitted. */
  truncated: boolean;
};

/** Completed generic ZIP extraction counts. */
export type ZipImportSummary = {
  /** Files newly created from the archive. */
  importedFiles: number;
  /** Ordinary existing files left unchanged by skip-existing policy. */
  skippedFiles: number;
  /** Directories newly created from the archive plan. */
  createdDirectories: number;
  /** Existing directories safely reused. */
  reusedDirectories: number;
};

/** Expected outcome of a generic ZIP import. */
export type ZipImportResult =
  | { status: 'conflicts'; report: ZipImportConflictReport }
  | { status: 'completed'; summary: ZipImportSummary };

/** Transfer-safe details attached to a terminal partial-import failure. */
export type ZipImportPartialFailureDetails = {
  /** Counts completed before the provider failure. */
  importSummary: ZipImportSummary;
};

/**
 * Stable error codes for repository ZIP export/import failures.
 * Archive structure failures (damaged archive, unsafe entry path) use `ZipArchiveErrorCode`
 * from `@shared/lib/zipArchive` instead, since that boundary detects them.
 */
export enum RepositoryZipErrorCode {
  documentStorageFilesNotFound = 'repositories.zipDocumentStorageFilesNotFound',
  importConflict = 'repositories.zipImportConflict',
  importResourceLimitExceeded = 'repositories.zipImportResourceLimitExceeded',
  /**
   * A ZIP import write failed after at least one earlier write in the same import already
   * succeeded. Unlike `importConflict`, the target directory may now hold a partial import.
   * This is a terminal outcome: the import is not retried or resumed automatically.
   */
  importWritePartiallyFailed = 'repositories.zipImportWritePartiallyFailed',
  /**
   * Repository storage for the import target could not be brought to a settled state (unflushed
   * document changes or previously queued/failed saves) before preflight. No write was attempted.
   */
  importStorageNotReady = 'repositories.zipImportStorageNotReady',
}

const zodZipImportPartialFailureDetails = z.object({
  importSummary: z.object({
    importedFiles: z.number(),
    skippedFiles: z.number(),
    createdDirectories: z.number(),
    reusedDirectories: z.number(),
  }),
});

/**
 * Reads validated transfer-safe details from a repository ZIP partial-failure error.
 * @param error - Unknown error crossing the worker/service boundary.
 * @returns Validated partial-failure details, or undefined for another error shape.
 */
export const getZipImportPartialFailureDetails = (
  error: unknown,
): ZipImportPartialFailureDetails | undefined => {
  if (
    !(error instanceof DomainError) ||
    error.code !== RepositoryZipErrorCode.importWritePartiallyFailed ||
    !zodIs(error, zodZipImportPartialFailureDetails)
  ) {
    return undefined;
  }
  return error;
};
