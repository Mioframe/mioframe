import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

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
        addSnackbar({
          text: `Error: ${error instanceof Error ? error.message : 'Error deleting Entry'}`,
        });

        throw error;
      }
    }
  };

  return {
    remove,
  };
};
