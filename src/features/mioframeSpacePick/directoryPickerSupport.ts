import { isFunction } from 'es-toolkit';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import type { useSnackbar } from '@shared/ui/Snackbar';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';

/**
 * Returns whether the current browser exposes the directory picker used by Mioframe spaces.
 * @returns `true` when `window.showDirectoryPicker` is available and callable.
 */
export const isDirectoryPickerSupported = () =>
  'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker);

/**
 * Shows the standard unsupported-browser snackbar for Mioframe space folder picking.
 * @param addSnackbar - Snackbar dispatcher used to surface the unsupported-browser message.
 */
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

/**
 * Opens the writable directory picker and treats user cancellation as no selection.
 * @returns Picked directory handle, or `undefined` when the user cancels the picker.
 */
export const pickWritableDirectory = async () => {
  try {
    return await window.showDirectoryPicker({
      mode: 'readwrite',
    });
  } catch (error) {
    if (isUserFileSelectionCancel(error)) {
      return undefined;
    }

    throw error;
  }
};
