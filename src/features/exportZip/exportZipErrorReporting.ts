import { DomainError } from '@shared/lib/error';
import { FileSystemDomainErrorCode } from '@shared/lib/fileSystem';

/**
 * Whether an export ZIP error should be reported to diagnostics. The bounded fallback-size error
 * is an expected, user-visible export outcome, not an unexpected failure worth capturing.
 * @param error - The error that ended the export.
 * @returns `false` for the expected fallback-size limit error, `true` otherwise.
 */
export const shouldReportExportZipError = (error: unknown): boolean =>
  !(
    error instanceof DomainError &&
    error.code === FileSystemDomainErrorCode.saveStreamFallbackTooLarge
  );
