import type { SafeDiagnosticDetails } from '../../diagnostics';
import { HttpStatusCode } from '../../error/httpStatus';

/** Conservative retryability classification for a Google Drive download failure. */
export type GoogleDriveDownloadRetryable = 'true' | 'false' | 'unknown';

/** Phase of a Google Drive download operation where a failure occurred. */
export type GoogleDriveDownloadPhase = 'metadata' | 'mediaDownload';

/** Stable error classification for a Google Drive download failure, derived only from HTTP status. */
export type GoogleDriveDownloadErrorCode =
  | 'authRequired'
  | 'permissionDenied'
  | 'notFound'
  | 'rateLimited'
  | 'serverError'
  | 'unknown';

/**
 * Returns whether the status falls in the 5xx server-error range.
 * @param status - HTTP-like status code from the failed request, when available.
 * @returns Whether the status is a 5xx server error.
 */
const isServerErrorStatus = (status: HttpStatusCode | undefined): boolean => {
  if (status === undefined) return false;
  const statusValue: number = status;
  return statusValue >= 500 && statusValue < 600;
};

/**
 * Classifies whether a Google Drive download failure is conservatively retryable.
 * 401/403/404 are treated as non-retryable, 429 and 5xx as retryable, everything else as unknown.
 * @param status - HTTP-like status code from the failed request, when available.
 * @returns Retryable classification.
 */
export const classifyGoogleDriveDownloadRetryable = (
  status: HttpStatusCode | undefined,
): GoogleDriveDownloadRetryable => {
  switch (status) {
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return 'true';
    case HttpStatusCode.UNAUTHORIZED:
    case HttpStatusCode.FORBIDDEN:
    case HttpStatusCode.NOT_FOUND:
      return 'false';
    default:
      return isServerErrorStatus(status) ? 'true' : 'unknown';
  }
};

/**
 * Classifies a stable, project-controlled error code for a Google Drive download failure.
 * @param status - HTTP-like status code from the failed request, when available.
 * @returns Stable error classification.
 */
export const classifyGoogleDriveDownloadErrorCode = (
  status: HttpStatusCode | undefined,
): GoogleDriveDownloadErrorCode => {
  switch (status) {
    case HttpStatusCode.UNAUTHORIZED:
      return 'authRequired';
    case HttpStatusCode.FORBIDDEN:
      return 'permissionDenied';
    case HttpStatusCode.NOT_FOUND:
      return 'notFound';
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return 'rateLimited';
    default:
      return isServerErrorStatus(status) ? 'serverError' : 'unknown';
  }
};

/** Matches short Google API reason/domain tokens (e.g. `insufficientFilePermissions`, `global`). */
const SAFE_TOKEN_RE = /^[A-Za-z0-9_.-]{1,64}$/;

const toSafeToken = (value: string | undefined): string | undefined =>
  value !== undefined && SAFE_TOKEN_RE.test(value) ? value : undefined;

/** Structural details about a Google Drive download failure, safe to surface in diagnostics. */
export interface GoogleDriveDownloadFailureDetails {
  /** Which part of the download flow failed. */
  phase: GoogleDriveDownloadPhase;
  /** HTTP-like status code from the failed request, when available. */
  status?: HttpStatusCode | undefined;
  /** Google API error reason token, when available. */
  reason?: string | undefined;
  /** Google API error domain token, when available. */
  domain?: string | undefined;
}

/**
 * Builds a privacy-safe diagnostic message describing a Google Drive download failure.
 * Only structural fields (operation, phase, HTTP status, Google error reason/domain tokens,
 * retryable classification, stable code) are included — never raw API messages, file ids, or paths.
 * @param details - Structural failure details.
 * @returns Safe diagnostic message suitable for an error cause.
 */
export const buildGoogleDriveDownloadFailureMessage = ({
  phase,
  status,
  reason,
  domain,
}: GoogleDriveDownloadFailureDetails): string => {
  const retryable = classifyGoogleDriveDownloadRetryable(status);
  const code = classifyGoogleDriveDownloadErrorCode(status);

  const parts = ['operation=googleDrive.download', `phase=${phase}`];
  if (status !== undefined) parts.push(`status=${status}`);
  const safeReason = toSafeToken(reason);
  if (safeReason !== undefined) parts.push(`reason=${safeReason}`);
  const safeDomain = toSafeToken(domain);
  if (safeDomain !== undefined) parts.push(`domain=${safeDomain}`);
  parts.push(`retryable=${retryable}`);
  parts.push(`code=${code}`);

  return `Google Drive download failed (${parts.join(' ')})`;
};

/**
 * Builds privacy-safe structured diagnostic details for a Google Drive download failure, suitable
 * for attaching to `captureDiagnosticException` as visible top-level Sentry context fields.
 * Only structural fields are included — never raw API messages, file ids, or paths.
 * @param details - Structural failure details.
 * @returns Safe structured diagnostic details.
 */
export const buildGoogleDriveDownloadFailureSafeDetails = ({
  phase,
  status,
  reason,
  domain,
}: GoogleDriveDownloadFailureDetails): SafeDiagnosticDetails => ({
  providerOperation: 'googleDrive.download',
  providerPhase: phase,
  providerStatus: status ?? null,
  providerReason: toSafeToken(reason) ?? null,
  providerDomain: toSafeToken(domain) ?? null,
  providerRetryable: classifyGoogleDriveDownloadRetryable(status),
  providerErrorCode: classifyGoogleDriveDownloadErrorCode(status),
});
