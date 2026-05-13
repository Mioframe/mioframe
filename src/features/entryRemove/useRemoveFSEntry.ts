import { useFileSystem } from '@entity/mountedDirectories';
import { createSafeErrorCause, DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { PathUtils, VfsError, FileSystemError } from '@shared/lib/virtualFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

const toReportedRemoveError = (error: unknown, message: string, causeMessage: string) => {
  if (error instanceof DomainError || error instanceof VfsError) {
    return error;
  }

  return new DomainError(message, {
    cause: createSafeErrorCause(causeMessage),
  });
};

/**
 * Creates a remove action that shows user-facing feedback for file-system entry deletion.
 * @returns Remove helpers for file-system entries.
 */
export const useRemoveFSEntry = () => {
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();

  const { remove: removeEntry } = useFileSystem();

  const remove = async (path: string) => {
    const name = PathUtils.basename(path);

    const sure = await confirm({
      headline: `Remove "${name}"?`,
      supportingText: `Are you sure you want to remove "${path}"?`,
      confirmLabel: 'Remove',
      symbolName: 'delete',
    });

    if (sure) {
      try {
        await removeEntry(path);
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.DirectoryNotEmpty) {
          const confirmNested = await confirm({
            headline: 'Directory not empty',
            supportingText:
              'This directory contains files or subdirectories. Do you want to remove them as well?',
            confirmLabel: 'Remove all',
            symbolName: 'cancel',
          });

          if (confirmNested) {
            addSnackbar({
              text: 'Removing directory with nested entries...',
            });
            try {
              await removeEntry(path, true);
            } catch (recursiveError) {
              const reportedError = toReportedRemoveError(
                recursiveError,
                'Could not remove the directory',
                'File system recursive remove operation failed',
              );

              addSnackbar({
                text:
                  recursiveError instanceof DomainError
                    ? recursiveError.message
                    : 'Could not remove the directory',
              });
              reportHandledError(reportedError, {
                feature: 'entryRemove',
                action: 'removeEntryRecursive',
              });
            }
          }
        } else {
          const reportedError = toReportedRemoveError(
            error,
            'Could not remove the item',
            'File system remove operation failed',
          );

          addSnackbar({
            text: error instanceof DomainError ? error.message : 'Could not remove the item',
          });
          reportHandledError(reportedError, {
            feature: 'entryRemove',
            action: 'removeEntry',
          });
        }
      }
    }
  };

  return {
    remove,
  };
};
