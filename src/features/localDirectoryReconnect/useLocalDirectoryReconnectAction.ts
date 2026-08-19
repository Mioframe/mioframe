import {
  isUserFileSelectionCancel,
  parseFileSystemUnavailableRootRecovery,
} from '@shared/lib/fileSystem';
import { inspectMioframeSpaceDirectory } from '@shared/lib/automergeAdapter';
import { useFileSystem } from '@entity/mountedDirectories';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';
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
const WRITE_RECOVERY_FAILURE_MESSAGE =
  'The folder is reconnected, but some pending changes could not be saved.';
const alreadyMountedMessage = (name: string) =>
  `Mioframe already has this folder open as "${name}".`;

/**
 * Owns the explicit user-triggered reconnect action for a remembered local-directory root that
 * can no longer be enumerated. Derives its own unavailable-root recovery from the supplied error
 * candidates, so widgets never parse local-directory provider payloads. Keeps the directory
 * picker call, safe-attempt/confirmation orchestration, and pending state out of widgets/pages.
 * `isSameEntry() === true` reconnects immediately; otherwise the selection is inspected for the
 * Mioframe storage marker and, when it looks like an existing Mioframe space, the user must
 * explicitly confirm before it is reconnected as a new mounted location. A non-Mioframe selection
 * is rejected without mutation.
 * @param errors - Recovery-relevant error candidates collected by the detecting layer.
 * @returns Explicit reconnect action handler and UI-facing state for the recovery controls.
 */
export const useLocalDirectoryReconnectAction = ({ errors }: { errors: Ref<unknown[]> }) => {
  const { reconnectDirectory, relocateRememberedDirectory } = useFileSystem();
  const { confirm } = useDialog();
  const { addSnackbar } = useSnackbar();
  const isReconnectPending = ref(false);
  const reconnectMessageOverride = ref<string>();

  const recovery = computed(() => {
    for (const error of errors.value) {
      const candidate = parseFileSystemUnavailableRootRecovery(error);

      if (candidate) {
        return candidate;
      }
    }

    return undefined;
  });

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

  const confirmReconnectAsNewLocation = () =>
    confirm({
      headline: 'Reconnect this Mioframe space?',
      supportingText:
        "Mioframe can't verify that this is the same folder it remembers. Continue only if you recognize the selected Mioframe space. Mioframe will reconnect the selected space without transferring unsaved in-memory changes from the unavailable location.",
      confirmLabel: 'Reconnect',
      cancelLabel: 'Cancel',
    });

  /**
   * Runs the reconnect action for the current unavailable-root recovery target.
   * @returns The mounted name the widget should navigate to, or `undefined` when the current
   * mounted path should be kept (same-entry reconnect) or no mutation occurred.
   */
  const reconnectFolder = async (): Promise<string | undefined> => {
    const currentRecovery = recovery.value;

    if (!currentRecovery || isReconnectPending.value) {
      return undefined;
    }

    if (!isReconnectSupported.value) {
      reconnectMessageOverride.value = 'Your browser does not support reconnecting folders.';
      return undefined;
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
              feature: 'localDirectoryReconnect',
              action: 'reconnectFolder',
            },
          );
          if (recovery.value === currentRecovery) {
            reconnectMessageOverride.value =
              'Could not open the folder picker. Try again from this action.';
          }
        }
        return undefined;
      }

      if (recovery.value !== currentRecovery) {
        return undefined;
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
            feature: 'localDirectoryReconnect',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = RECONNECT_FAILED_MESSAGE;
        }
        return undefined;
      }

      // `result` is now a committed service outcome. It stays authoritative even if this
      // mutation is itself what makes `recovery.value` disappear or change afterward.
      if (result.status === 'reconnected') {
        reconnectMessageOverride.value = undefined;
        return undefined;
      }

      if (result.status === 'reconnectedWithWriteRecoveryFailure') {
        addSnackbar({ text: WRITE_RECOVERY_FAILURE_MESSAGE });
        return undefined;
      }

      if (result.status === 'missingRecord') {
        reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
        return undefined;
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
            feature: 'localDirectoryReconnect',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = INSPECT_FAILED_MESSAGE;
        }
        return undefined;
      }

      if (recovery.value !== currentRecovery) {
        return undefined;
      }

      if (!inspection.looksLikeExistingSpace) {
        reconnectMessageOverride.value = NOT_A_MIOFRAME_SPACE_MESSAGE;
        return undefined;
      }

      const confirmed = await confirmReconnectAsNewLocation();

      if (recovery.value !== currentRecovery || !confirmed) {
        return undefined;
      }

      let relocateResult: Awaited<ReturnType<typeof relocateRememberedDirectory>>;

      try {
        relocateResult = await relocateRememberedDirectory({
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
            feature: 'localDirectoryReconnect',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value = RECONNECT_FAILED_MESSAGE;
        }
        return undefined;
      }

      // `relocateResult` is now a committed service outcome. It stays authoritative even if this
      // mutation is itself what makes `recovery.value` disappear or change afterward.
      if (relocateResult.status === 'relocated') {
        reconnectMessageOverride.value = undefined;
        return relocateResult.name;
      }

      if (relocateResult.status === 'alreadyMounted') {
        reconnectMessageOverride.value = alreadyMountedMessage(relocateResult.name);
        return relocateResult.name;
      }

      reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
      return undefined;
    } finally {
      isReconnectPending.value = false;
    }
  };

  return {
    hasUnavailableRootRecovery: computed(() => !!recovery.value),
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
