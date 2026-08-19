import type { FileSystemUnavailableRootRecovery } from '@shared/lib/fileSystem';
import { inspectMioframeSpaceDirectory, isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useFileSystem } from '@entity/mountedDirectories';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { useDialog } from '@shared/ui/Dialog';
import { isFunction } from 'es-toolkit';
import { computed, ref, watch, type Ref } from 'vue';

enum LocalDirectoryReconnectErrorCode {
  pickerFailed = 'localDirectoryReconnect.pickerFailed',
  reconnectFailed = 'localDirectoryReconnect.reconnectFailed',
  inspectFailed = 'localDirectoryReconnect.inspectFailed',
}

const RECONNECT_FAILED_MESSAGE = 'Could not reconnect this folder. Try again from this action.';
const INSPECT_FAILED_MESSAGE = 'Could not inspect this folder. Try again from this action.';
const NOT_A_MIOFRAME_SPACE_MESSAGE =
  'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.';
const MISSING_RECORD_MESSAGE = 'Mioframe no longer remembers this folder.';
const REPOSITORY_STATE_ACTIVE_MESSAGE =
  'Mioframe still has this space open in memory. Reload Mioframe, then reconnect the folder again.';
const WRITE_RECOVERY_FAILURE_MESSAGE =
  'The folder is reconnected, but some pending changes could not be saved.';

/**
 * Owns the explicit user-triggered reconnect action for a remembered local-directory root that
 * can no longer be enumerated. Keeps the directory picker call, safe-attempt/confirmation
 * orchestration, and pending state out of widgets/pages. `isSameEntry() === true` reconnects
 * immediately; otherwise the selection is inspected for the Mioframe storage marker and, when it
 * looks like an existing Mioframe space, the user must explicitly confirm before the remembered
 * location is replaced. A non-Mioframe selection is rejected without mutation.
 * @param recovery - Current unavailable-root recovery request exposed by the detecting layer.
 * @returns Explicit reconnect action handler and UI-facing state for the recovery controls.
 */
export const useLocalDirectoryReconnectAction = ({
  recovery,
}: {
  recovery: Ref<FileSystemUnavailableRootRecovery | undefined>;
}) => {
  const { reconnectDirectory, replaceRememberedDirectory } = useFileSystem();
  const { confirm } = useDialog();
  const isReconnectPending = ref(false);
  const reconnectMessageOverride = ref<string>();

  const isReconnectSupported = computed(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  watch(
    recovery,
    () => {
      reconnectMessageOverride.value = undefined;
    },
    { immediate: true },
  );

  const confirmReplaceRememberedLocation = (spaceName: string) =>
    confirm({
      headline: 'Reconnect this Mioframe space?',
      supportingText: `Mioframe can't verify that this is the same folder it remembers. Continue only if you moved or renamed the original space. The selected folder will replace the remembered location for "${spaceName}".`,
      confirmLabel: 'Replace location',
      cancelLabel: 'Cancel',
    });

  const reconnectFolder = async (): Promise<void> => {
    const currentRecovery = recovery.value;

    if (!currentRecovery || isReconnectPending.value) {
      return;
    }

    if (!isReconnectSupported.value) {
      reconnectMessageOverride.value = 'Your browser does not support reconnecting folders.';
      return;
    }

    isReconnectPending.value = true;

    try {
      let handle: FileSystemDirectoryHandle;

      try {
        handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      } catch (error) {
        if (!isUserFileSelectionCancel(error)) {
          captureDiagnosticException(
            new DomainError('Could not open the folder picker. Try again from this action.', {
              cause: error,
              code: LocalDirectoryReconnectErrorCode.pickerFailed,
            }),
            {
              feature: 'localDirectoryRecovery',
              action: 'reconnectFolder',
            },
          );
          if (recovery.value === currentRecovery) {
            reconnectMessageOverride.value =
              'Could not open the folder picker. Try again from this action.';
          }
        }
        return;
      }

      if (recovery.value !== currentRecovery) {
        return;
      }

      let result: Awaited<ReturnType<typeof reconnectDirectory>>;

      try {
        result = await reconnectDirectory({
          handle,
          spaceName: currentRecovery.spaceName,
        });
      } catch (error) {
        captureDiagnosticException(
          new DomainError(RECONNECT_FAILED_MESSAGE, {
            cause: error,
            code: LocalDirectoryReconnectErrorCode.reconnectFailed,
          }),
          {
            feature: 'localDirectoryRecovery',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = RECONNECT_FAILED_MESSAGE;
        }
        return;
      }

      if (recovery.value !== currentRecovery) {
        return;
      }

      if (result.status === 'reconnected') {
        reconnectMessageOverride.value = undefined;
        return;
      }

      if (result.status === 'reconnectedWithWriteRecoveryFailure') {
        reconnectMessageOverride.value = WRITE_RECOVERY_FAILURE_MESSAGE;
        return;
      }

      if (result.status === 'missingRecord') {
        reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
        return;
      }

      // result.status === 'confirmationRequired': locator equality is false or unverifiable.
      // Inspect the selection for the Mioframe storage marker before asking for confirmation.
      let inspection: Awaited<ReturnType<typeof inspectMioframeSpaceDirectory>>;

      try {
        inspection = await inspectMioframeSpaceDirectory(handle);
      } catch (error) {
        captureDiagnosticException(
          new DomainError(INSPECT_FAILED_MESSAGE, {
            cause: error,
            code: LocalDirectoryReconnectErrorCode.inspectFailed,
          }),
          {
            feature: 'localDirectoryRecovery',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = INSPECT_FAILED_MESSAGE;
        }
        return;
      }

      if (recovery.value !== currentRecovery) {
        return;
      }

      if (!inspection.looksLikeExistingSpace) {
        reconnectMessageOverride.value = NOT_A_MIOFRAME_SPACE_MESSAGE;
        return;
      }

      const confirmed = await confirmReplaceRememberedLocation(currentRecovery.spaceName);

      if (recovery.value !== currentRecovery || !confirmed) {
        return;
      }

      let replaceResult: Awaited<ReturnType<typeof replaceRememberedDirectory>>;

      try {
        replaceResult = await replaceRememberedDirectory({
          handle,
          spaceName: currentRecovery.spaceName,
        });
      } catch (error) {
        captureDiagnosticException(
          new DomainError(RECONNECT_FAILED_MESSAGE, {
            cause: error,
            code: LocalDirectoryReconnectErrorCode.reconnectFailed,
          }),
          {
            feature: 'localDirectoryRecovery',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = RECONNECT_FAILED_MESSAGE;
        }
        return;
      }

      if (recovery.value !== currentRecovery) {
        return;
      }

      if (replaceResult.status === 'reconnected') {
        reconnectMessageOverride.value = undefined;
      } else if (replaceResult.status === 'repositoryStateActive') {
        reconnectMessageOverride.value = REPOSITORY_STATE_ACTIVE_MESSAGE;
      } else {
        reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
      }
    } finally {
      isReconnectPending.value = false;
    }
  };

  return {
    isReconnectDisabled: computed(() => !recovery.value || isReconnectPending.value),
    isReconnectPending,
    reconnectFolder,
    reconnectMessage: computed(
      () =>
        reconnectMessageOverride.value ??
        (recovery.value
          ? `Mioframe can't open "${recovery.value.spaceName}" anymore. It may have been moved, renamed, or removed.`
          : ''),
    ),
  };
};
