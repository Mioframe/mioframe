import { useFileSystem } from '@entity/mountedDirectories';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { PathUtils, VfsError, FileSystemError } from '@shared/lib/virtualFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

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

    const sure = await confirm(
      `Remove "${name}"?`,
      `Are you sure you want to remove "${path}"?`,
      'Remove',
      'delete',
    );

    if (sure) {
      try {
        await removeEntry(path);
      } catch (error) {
        if (error instanceof VfsError && error.code === FileSystemError.DirectoryNotEmpty) {
          const confirmNested = await confirm(
            'Directory not empty',
            'This directory contains files or subdirectories. Do you want to remove them as well?',
            'Remove all',
            'cancel',
          );

          if (confirmNested) {
            addSnackbar({
              text: 'Removing directory with nested entries...',
            });
            try {
              await removeEntry(path, true);
            } catch (recursiveError) {
              addSnackbar({
                text:
                  recursiveError instanceof DomainError
                    ? recursiveError.message
                    : 'Could not remove the directory',
              });
              reportHandledError(recursiveError, {
                feature: 'entryRemove',
                action: 'removeEntryRecursive',
                path,
              });
            }
          }
        } else {
          addSnackbar({
            text: error instanceof DomainError ? error.message : 'Could not remove the item',
          });
          reportHandledError(error, {
            feature: 'entryRemove',
            action: 'removeEntry',
            path,
          });
        }
      }
    }
  };

  return {
    remove,
  };
};
