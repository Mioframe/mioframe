import { useFileSystem } from '@entity/mountedDirectories';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

export const useDisconnectDeviceDirectory = () => {
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { disconnectDeviceFile } = useFileSystem();

  const disconnectDeviceDirectory = async (name: string) => {
    const sure = await confirm(
      `Disconnect "${name}"?`,
      `This removes "${name}" from the app sidebar, but does not delete files from your device.`,
      'Disconnect',
      'link_off',
    );

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
