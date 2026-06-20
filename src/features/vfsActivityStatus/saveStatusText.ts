import { dayjs } from '@shared/lib/dayjs';
import { sanitizePrimitiveString } from '@shared/lib/diagnostics/privacySanitizer';
import {
  FileSystemError,
  VfsError,
  type VfsActivityError,
  type VfsActivityState,
} from '@shared/lib/virtualFileSystem';

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

const isWriteStreamOpenFailed = (error: VfsActivityError | undefined): boolean =>
  error?.operationType === 'writeFile' &&
  error.cause instanceof VfsError &&
  error.cause.code === FileSystemError.WriteStreamOpenFailed;

const getSafeBrowserErrorName = (error: unknown): string | undefined =>
  error instanceof DOMException ? error.name : error instanceof Error ? error.name : undefined;

const getSafeBrowserErrorDetail = (error: unknown): string | undefined =>
  error instanceof DOMException || error instanceof Error
    ? sanitizePrimitiveString(error.message)
    : undefined;

/**
 * Identifies the save-status error branch that owns the current UI copy.
 * @param error - Last tracked VFS mutation error, if any.
 * @returns Stable save-status error kind or `generic` when no special handling applies.
 */
export const getSaveStatusErrorKind = (
  error: VfsActivityError | undefined,
): 'generic' | 'writeStreamOpenFailed' => {
  if (isWriteStreamOpenFailed(error)) {
    return 'writeStreamOpenFailed';
  }

  return 'generic';
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

  if (getSaveStatusErrorKind(error) === 'writeStreamOpenFailed') {
    const browserCause =
      error.cause instanceof VfsError ? getSafeBrowserErrorName(error.cause.cause) : undefined;
    const browserDetail =
      error.cause instanceof VfsError ? getSafeBrowserErrorDetail(error.cause.cause) : undefined;

    lines.push(
      'Failure: write stream open failed',
      'Phase: writableOpen',
      'Recommendation: choose another storage location',
    );

    if (browserCause !== undefined) {
      lines.push(`Browser error: ${browserCause}`);
    }

    if (browserDetail !== undefined) {
      lines.push(`Browser detail: ${browserDetail}`);
    }
  }

  lines.push('Details are hidden to protect private repository data.');

  return lines.join('\n');
};
