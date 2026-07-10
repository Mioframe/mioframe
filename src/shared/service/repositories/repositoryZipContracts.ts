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

/** Archive entry whose provider mutation may have taken effect before it rejected. */
export type ZipImportUncertainEntry = {
  /** Safe path relative to the selected import target. */
  relativePath: string;
  /** Archive entry kind attempted by the provider. */
  kind: 'file' | 'directory';
};

/** Service-issued context required to safely continue an uncertain import. */
export type ZipImportRecoveryContext = {
  /** Provider mutation whose completion is uncertain, when one was active. */
  uncertainEntry?: ZipImportUncertainEntry | undefined;
};

/** Explicit options for conflict handling and service-issued partial recovery. */
export type ZipImportOptions = {
  /** Existing-target behavior; defaults to abort. */
  conflictPolicy?: ZipImportConflictPolicy;
  /** Previously returned service recovery identity. */
  recovery?: ZipImportRecoveryContext;
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
  /** Existing uncertain files proven identical to the archive. */
  verifiedFiles: number;
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
  | {
      status: 'recoveryUnresolved';
      report: {
        relativePath: string;
        reason: 'contentMismatch' | 'typeMismatch';
      };
    }
  | { status: 'completed'; summary: ZipImportSummary };

/** Transfer-safe details attached to an uncertain provider failure. */
export type ZipImportPartialFailureDetails = {
  /** Counts completed before the provider failure. */
  importSummary: ZipImportSummary;
  /** Service-issued identity required for a safe retry. */
  recoveryContext: ZipImportRecoveryContext;
  /** Indicates the active provider call may have changed its target. */
  mutationMayHaveOccurred: true;
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
   */
  importWritePartiallyFailed = 'repositories.zipImportWritePartiallyFailed',
  /** A caller supplied stale or invalid recovery context. */
  importRecoveryContextInvalid = 'repositories.zipImportRecoveryContextInvalid',
  /**
   * Repository storage for the import target could not be brought to a settled state (unflushed
   * document changes or previously queued/failed saves) before preflight. No write was attempted.
   */
  importStorageNotReady = 'repositories.zipImportStorageNotReady',
}

const zodZipImportPartialFailureDetails = z.object({
  importSummary: z.object({
    importedFiles: z.number(),
    verifiedFiles: z.number(),
    skippedFiles: z.number(),
    createdDirectories: z.number(),
    reusedDirectories: z.number(),
  }),
  recoveryContext: z.object({
    uncertainEntry: z.optional(
      z.object({ relativePath: z.string(), kind: z.enum(['file', 'directory']) }),
    ),
  }),
  mutationMayHaveOccurred: z.literal(true),
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
