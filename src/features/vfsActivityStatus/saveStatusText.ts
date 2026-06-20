import { dayjs } from '@shared/lib/dayjs';
import { DomainError } from '@shared/lib/error';
import { sanitizePrimitiveString } from '@shared/lib/diagnostics/privacySanitizer';
import type { VfsActivityError, VfsActivityState } from '@shared/lib/virtualFileSystem';

export const CHIP_STATUS_LABELS: Record<Exclude<VfsActivityState['status'], 'idle'>, string> = {
  active: 'Saving…',
  error: 'Save failed',
};

/**
 * Formats the VFS activity timestamp with the shared localized dayjs wrapper.
 * @param occurredAt - Unix timestamp in milliseconds.
 * @returns Localized timestamp string for save-status UI.
 */
export const formatSaveStatusTimestamp = (occurredAt: number): string =>
  dayjs(occurredAt).format('lll');

const normalizeSafeMessage = (message: string): string =>
  message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ');

const getErrorName = (error: unknown): string | undefined =>
  error instanceof Error ? error.name : undefined;

const getErrorClassName = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const constructorName = error.constructor.name;
  return typeof constructorName === 'string' && constructorName.length > 0
    ? constructorName
    : error.name;
};

const getErrorCode = (error: unknown): string | number | undefined =>
  error instanceof DomainError ? error.code : undefined;

const getErrorCause = (error: unknown): unknown =>
  error instanceof Error ? error.cause : undefined;

const formatDomExceptionCauseDetails = (error: unknown): string[] => {
  if (!(error instanceof DOMException)) {
    return [];
  }

  const lines = [`Browser error name: ${error.name}`];
  const safeMessage = sanitizePrimitiveString(error.message);
  if (safeMessage !== undefined) {
    lines.push(`Browser error message: ${safeMessage}`);
  }

  return lines;
};

const formatGenericErrorCauseDetails = (error: unknown): string[] => {
  if (!(error instanceof Error) || error instanceof DOMException) {
    return [];
  }

  const lines = [`Cause name: ${error.name}`];
  const safeMessage = sanitizePrimitiveString(error.message);

  if (safeMessage !== undefined) {
    lines.push(`Cause message: ${safeMessage}`);
  }

  return lines;
};

const formatErrorCauseDetails = (error: unknown): string[] => {
  if (error instanceof DOMException) {
    return formatDomExceptionCauseDetails(error);
  }

  if (error instanceof Error) {
    return formatGenericErrorCauseDetails(error);
  }

  return [];
};

/**
 * Builds a copyable English error summary for the save-status tooltip.
 * @param error - Last tracked VFS mutation error, if any.
 * @returns Multi-line tooltip text or `undefined` when no error exists.
 */
export const formatSaveStatusErrorDetails = (
  error: VfsActivityError | undefined,
): string | undefined => {
  if (!error) {
    return undefined;
  }

  const operationLabel = {
    writeFile: 'write file',
    createDirectory: 'create directory',
    delete: 'delete entry',
    move: 'move entry',
  } satisfies Record<VfsActivityError['operationType'], string>;

  const lines = [
    'Could not save changes',
    `Operation: ${operationLabel[error.operationType]}`,
    `Time: ${formatSaveStatusTimestamp(error.occurredAt)}`,
  ];
  const topLevelErrorName = getErrorName(error.cause);
  const stableCode = getErrorCode(error.cause);
  const safeMessage =
    error.cause instanceof DomainError ? normalizeSafeMessage(error.cause.message) : undefined;
  const nestedCause = getErrorCause(error.cause);
  const nestedCauseClass = getErrorClassName(nestedCause);
  const errorCauseDetails = formatErrorCauseDetails(nestedCause);

  if (topLevelErrorName !== undefined) {
    lines.push(`Top-level error: ${topLevelErrorName}`);
  }

  if (stableCode !== undefined) {
    lines.push(`Stable code: ${String(stableCode)}`);
  }

  if (safeMessage !== undefined) {
    lines.push(`Safe message: ${safeMessage}`);
  }

  if (nestedCauseClass !== undefined) {
    lines.push(`Cause class: ${nestedCauseClass}`);
  }

  lines.push(...errorCauseDetails);

  return lines.join('\n');
};
