import { computed, ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { useSnackbar } from '@shared/ui/Snackbar';
import {
  isDirectoryPickerSupported,
  pickWritableDirectory,
  showDirectoryPickerUnsupportedMessage,
} from './directoryPickerSupport';
import { MioframeSpacePickErrorCode } from './mioframeSpacePick.errors';

/**
 * Owns the parent-directory picker state for creating a Mioframe space.
 * @returns Picker state plus commands for choosing or clearing the selected parent directory.
 */
export const useMioframeSpaceParentPicker = () => {
  const loading = ref(false);
  const parentHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
  const { addSnackbar } = useSnackbar();
  const isSupported = computed(() => isDirectoryPickerSupported());

  const reportPickerFailure = (error: unknown) => {
    const reportedError =
      error instanceof DomainError
        ? error
        : new DomainError('Could not create the Mioframe space', {
            cause: error,
            code: MioframeSpacePickErrorCode.createFailed,
          });

    addSnackbar({
      text: reportedError.message,
    });
    captureDiagnosticException(reportedError, {
      feature: 'mioframeSpaceCreate',
      action: 'pickParentFolder',
    });
  };

  const pickParentDirectory = async () => {
    if (loading.value || parentHandle.value) {
      return;
    }

    if (!isSupported.value) {
      showDirectoryPickerUnsupportedMessage(addSnackbar);
      return;
    }

    loading.value = true;

    try {
      parentHandle.value = await pickWritableDirectory();
    } catch (error) {
      reportPickerFailure(error);
    } finally {
      loading.value = false;
    }
  };

  const resetParentDirectory = () => {
    parentHandle.value = undefined;
  };

  return {
    loading,
    parentHandle,
    isSupported,
    pickParentDirectory,
    resetParentDirectory,
  };
};
