import {
  isUserFileSelectionCancel,
  parseFileSystemUnavailableRootRecovery,
  type FileSystemUnavailableRootRecovery,
} from '@shared/lib/fileSystem';
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
}

const PICKER_FAILED_MESSAGE = 'Could not open the folder picker. Try again from this action.';
const RECONNECT_FAILED_MESSAGE = 'Could not reconnect this folder. Try again from this action.';
const NOT_A_MIOFRAME_SPACE_MESSAGE =
  'That folder does not contain a Mioframe space. Choose the moved or renamed Mioframe folder.';
const MISSING_RECORD_MESSAGE = 'Mioframe no longer remembers this folder.';
const STALE_RECOVERY_MESSAGE =
  'This folder recovery is no longer available. Try again from this action.';
const WRITE_RECOVERY_FAILURE_MESSAGE =
  'The folder is reconnected, but some pending changes could not be saved.';
const alreadyMountedMessage = (name: string) =>
  `Mioframe already has this folder open as "${name}".`;

/**
 * Reports an unexpected failure and returns the safe message to show for it. Preserves an
 * already-safe `DomainError` as-is instead of masking its message with a generic fallback;
 * wraps any other raw error in a new `DomainError` using the fallback message and code.
 * @param error - Unexpected error caught from a picker or service call.
 * @param fallbackMessage - Safe fallback message used when `error` is not already a `DomainError`.
 * @param code - Stable error code used when wrapping a raw error.
 * @returns The safe user-facing message for the reported error.
 */
const reportUnexpectedFailure = (
  error: unknown,
  fallbackMessage: string,
  code: LocalDirectoryReconnectErrorCode,
): string => {
  const reportedError =
    error instanceof DomainError ? error : new DomainError(fallbackMessage, { cause: error, code });

  captureDiagnosticException(reportedError, {
    feature: 'localDirectoryReconnect',
    action: 'reconnectFolder',
  });

  return reportedError.message;
};

/**
 * Owns the explicit user-triggered reconnect action for a remembered local-directory root that
 * can no longer be enumerated. Derives its own unavailable-root recovery from the supplied error
 * candidates, so widgets never parse local-directory provider payloads. Keeps the directory
 * picker call, safe-attempt/confirmation orchestration, and pending state out of widgets/pages.
 * `isSameEntry() === true` reconnects immediately. Otherwise the fileSystem service inspects the
 * selection for the canonical Mioframe marker; when it looks like an existing Mioframe space the
 * user must explicitly confirm before it is reconnected as a new mounted location. A non-Mioframe
 * selection or a stale recovery target is rejected without mutation.
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

  // Recovery identity is `recoveryKey`, not `spaceName` or object identity: `recoveryKey`
  // identifies one mounted provider instance, so a reactive reread that re-emits an equivalent
  // recovery for the same remembered folder carries the same key, while a replacement provider
  // reusing the same `spaceName` carries a different key.
  const isCurrentTarget = (target: FileSystemUnavailableRootRecovery) =>
    recovery.value?.recoveryKey === target.recoveryKey;

  const isReconnectSupported = computed(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  // Keyed on `recoveryKey`, not `spaceName`, so a reactive reread that re-emits an equivalent
  // recovery for the same mounted provider does not clear an in-progress
  // picker/confirmation/retry message. Feedback is cleared only when the target actually changes
  // to a different provider or disappears.
  const currentTargetRecoveryKey = computed(() => recovery.value?.recoveryKey);

  watch(
    currentTargetRecoveryKey,
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
          const message = reportUnexpectedFailure(
            error,
            PICKER_FAILED_MESSAGE,
            LocalDirectoryReconnectErrorCode.pickerFailed,
          );
          if (isCurrentTarget(currentRecovery)) {
            reconnectMessageOverride.value = message;
          }
        }
        return undefined;
      }

      if (!isCurrentTarget(currentRecovery)) {
        return undefined;
      }

      let result: Awaited<ReturnType<typeof reconnectDirectory>>;

      try {
        result = await reconnectDirectory({
          handle,
          spaceName: currentRecovery.spaceName,
          recoveryKey: currentRecovery.recoveryKey,
        });
      } catch (error) {
        const message = reportUnexpectedFailure(
          error,
          RECONNECT_FAILED_MESSAGE,
          LocalDirectoryReconnectErrorCode.reconnectFailed,
        );
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = message;
        }
        return undefined;
      }

      // `result` is now a committed service outcome once it is a mutation result. It stays
      // authoritative even if this mutation is itself what makes `recovery.value` disappear or
      // change afterward. Non-mutation statuses only apply feedback while this action's target is
      // still current, so a delayed result cannot overwrite a newer target's feedback.
      if (result.status === 'reconnected') {
        reconnectMessageOverride.value = undefined;
        return undefined;
      }

      if (result.status === 'reconnectedWithWriteRecoveryFailure') {
        addSnackbar({ text: WRITE_RECOVERY_FAILURE_MESSAGE });
        return undefined;
      }

      if (result.status === 'missingRecord') {
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
        }
        return undefined;
      }

      if (result.status === 'staleRecovery') {
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = STALE_RECOVERY_MESSAGE;
        }
        return undefined;
      }

      if (result.status === 'invalidCandidate') {
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = NOT_A_MIOFRAME_SPACE_MESSAGE;
        }
        return undefined;
      }

      // result.status === 'confirmationRequired': locator equality is false or unverifiable, and
      // the service already confirmed the selection carries the canonical Mioframe marker.
      if (!isCurrentTarget(currentRecovery)) {
        return undefined;
      }

      const confirmed = await confirmReconnectAsNewLocation();

      if (!isCurrentTarget(currentRecovery) || !confirmed) {
        return undefined;
      }

      let relocateResult: Awaited<ReturnType<typeof relocateRememberedDirectory>>;

      try {
        relocateResult = await relocateRememberedDirectory({
          handle,
          spaceName: currentRecovery.spaceName,
          recoveryKey: currentRecovery.recoveryKey,
        });
      } catch (error) {
        const message = reportUnexpectedFailure(
          error,
          RECONNECT_FAILED_MESSAGE,
          LocalDirectoryReconnectErrorCode.reconnectFailed,
        );
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = message;
        }
        return undefined;
      }

      // `relocateResult` is now a committed service outcome once it is a mutation result. It
      // stays authoritative even if this mutation is itself what makes `recovery.value`
      // disappear or change afterward.
      if (relocateResult.status === 'relocated') {
        reconnectMessageOverride.value = undefined;
        return relocateResult.name;
      }

      if (relocateResult.status === 'alreadyMounted') {
        reconnectMessageOverride.value = alreadyMountedMessage(relocateResult.name);
        return relocateResult.name;
      }

      if (relocateResult.status === 'invalidCandidate') {
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = NOT_A_MIOFRAME_SPACE_MESSAGE;
        }
        return undefined;
      }

      if (relocateResult.status === 'staleRecovery') {
        if (isCurrentTarget(currentRecovery)) {
          reconnectMessageOverride.value = STALE_RECOVERY_MESSAGE;
        }
        return undefined;
      }

      // relocateResult.status === 'missingRecord'
      if (isCurrentTarget(currentRecovery)) {
        reconnectMessageOverride.value = MISSING_RECORD_MESSAGE;
      }
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
