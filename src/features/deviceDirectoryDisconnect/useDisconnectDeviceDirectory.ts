import { useFileSystem } from '@entity/mountedDirectories';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

/**
 * Creates a disconnect action for removing a mounted device directory from the sidebar.
 * @returns Disconnect action with snackbar feedback.
 */
export const useDisconnectDeviceDirectory = () => {
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { disconnectDeviceFile } = useFileSystem();

  const disconnectDeviceDirectory = async (name: string) => {
    const sure = await confirm({
      headline: `Disconnect "${name}"?`,
      supportingText: `This removes "${name}" from the app sidebar, but does not delete files from your device.`,
      confirmLabel: 'Disconnect',
      symbolName: 'link_off',
    });

    if (!sure) {
      return;
    }

    try {
      await disconnectDeviceFile(name);
      addSnackbar({
        text: `"${name}" disconnected`,
      });
    } catch (error) {
      addSnackbar({
        text: `Error: ${error instanceof Error ? error.message : 'Error disconnecting directory'}`,
      });
      throw error;
    }
  };

  return {
    disconnectDeviceDirectory,
  };
};
