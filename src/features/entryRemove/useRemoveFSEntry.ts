import { useFileSystem } from '@entity/mountedDirectories';
import { DomainError } from '@shared/lib/error';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { PathUtils, VfsError, FileSystemError } from '@shared/lib/virtualFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

enum EntryRemoveErrorCode {
  removeFailed = 'entryRemove.removeFailed',
  recursiveRemoveFailed = 'entryRemove.recursiveRemoveFailed',
}

/**
 * Creates a user-triggered remove action for file-system entries.
 *
 * The action owns confirmation dialogs, recursive-directory confirmation, snackbar feedback,
 * and privacy-safe handled diagnostics for remove failures.
 * @returns Remove helper for absolute file-system entry paths.
 */
export const useRemoveFSEntry = () => {
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();

  const { remove: removeEntry } = useFileSystem();

  /**
   * Confirms and removes a file-system entry by absolute path.
   * @param path - Absolute file-system entry path to remove.
   * @returns Promise that resolves after the user decision and any requested remove attempt.
   */
  const remove = async (path: string) => {
    const name = PathUtils.basename(path);

    const sure = await confirm({
      headline: `Remove "${name}"?`,
      supportingText: 'This item will be removed.',
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
              const reportedError = new DomainError('Could not remove the directory', {
                cause: recursiveError,
                code: EntryRemoveErrorCode.recursiveRemoveFailed,
              });

              addSnackbar({
                text: 'Could not remove the directory',
              });
              captureDiagnosticException(reportedError, {
                feature: 'entryRemove',
                action: 'removeEntryRecursive',
              });
            }
          }
        } else {
          const reportedError = new DomainError('Could not remove the item', {
            cause: error,
            code: EntryRemoveErrorCode.removeFailed,
          });

          addSnackbar({
            text: 'Could not remove the item',
          });
          captureDiagnosticException(reportedError, {
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
