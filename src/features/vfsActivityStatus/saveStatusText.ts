import { dayjs } from '@shared/lib/dayjs';
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

  return [
    'Could not save changes',
    `Operation: ${operationLabel[error.operationType]}`,
    `Time: ${formatSaveStatusTimestamp(error.occurredAt)}`,
    'Details are hidden to protect private repository data.',
  ].join('\n');
};
