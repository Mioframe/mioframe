import { dayjs } from '@shared/lib/dayjs';
import type { VfsActivityError, VfsActivityState } from '@shared/lib/virtualFileSystem';

export const STATUS_LABELS: Record<VfsActivityState['status'], string> = {
  idle: 'All changes saved',
  active: 'Saving…',
  error: 'Could not save changes',
};

/**
 * Formats the VFS activity timestamp with the shared localized dayjs wrapper.
 * @param occurredAt - Unix timestamp in milliseconds.
 * @returns Localized timestamp string for save-status UI.
 */
export const formatSaveStatusTimestamp = (occurredAt: number): string =>
  dayjs(occurredAt).format('lll');

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

  return [
    'Could not save changes',
    `Operation: ${error.operationType}`,
    `Path: ${error.path}`,
    ...(error.newPath ? [`New path: ${error.newPath}`] : []),
    `Time: ${formatSaveStatusTimestamp(error.occurredAt)}`,
    `Message: ${error.message}`,
  ].join('\n');
};
