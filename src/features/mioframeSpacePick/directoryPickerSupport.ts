import { isFunction } from 'es-toolkit';
import type { useSnackbar } from '@shared/ui/Snackbar';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';

export const isDirectoryPickerSupported = () =>
  'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker);

export const showDirectoryPickerUnsupportedMessage = (
  addSnackbar: ReturnType<typeof useSnackbar>['addSnackbar'],
) => {
  addSnackbar({
    text: UNSUPPORTED_MESSAGE,
    actionLabel: 'More details',
    timeout: 5e3,
    callback: () => {
      window.open(
        'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
        '_blank',
      );
    },
  });
};
