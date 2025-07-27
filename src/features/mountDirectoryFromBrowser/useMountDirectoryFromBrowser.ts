import { useMountedDirectories } from '@entity/mountedDirectories/useMountedDirectories';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
import { isFunction } from 'es-toolkit';
import { toRef } from 'vue';

export const OPFSName = 'Origin private file system';
export const OPFS = OPFSName;

export const useMountDirectoryFromBrowser = () => {
  const { mount, map: mountedDirectories } = useMountedDirectories();

  const isSupportUserDirectory = toRef(
    () =>
      'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const { addSnackbar } = useSnackbar();

  const { alert } = useDialog();

  const mountUserDirectory = async () => {
    if (isSupportUserDirectory.value) {
      await alert(
        'Mounting user directory',
        'Allow and select a directory to use in the application',
      );

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      mount(createLocalDirectory(directoryHandle, undefined));
    } else {
      addSnackbar({
        text: 'Your browser does not support the use of user directories',
        actionLabel: 'More details',
        timeout: 5e3,
        callback: () => {
          window.open(
            'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
            '_black',
          );
        },
      });
    }
  };

  const mountOPFS = async () => {
    if (!mountedDirectories.value.has(OPFSName)) {
      const directory = await navigator.storage.getDirectory();
      const directoryFSEntry = createLocalDirectory(
        directory,
        undefined,
        OPFSName,
      );
      mount(directoryFSEntry, OPFSName);
    }
  };

  void mountOPFS();

  return {
    mountUserDirectory,
    isSupportUserDirectory,
    mountOPFS,
  };
};
