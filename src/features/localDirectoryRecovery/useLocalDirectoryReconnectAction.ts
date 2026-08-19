import type { FileSystemUnavailableRootRecovery } from '@shared/lib/fileSystem';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useFileSystem } from '@entity/mountedDirectories';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { isFunction } from 'es-toolkit';
import { computed, ref, watch, type Ref } from 'vue';

enum LocalDirectoryReconnectErrorCode {
  pickerFailed = 'localDirectoryReconnect.pickerFailed',
  reconnectFailed = 'localDirectoryReconnect.reconnectFailed',
}

/**
 * Owns the explicit user-triggered reconnect action for a remembered local-directory root that
 * can no longer be enumerated. Keeps the directory picker call, identity-result messaging, and
 * pending state out of widgets/pages. Reconnect never falls back to mounting a new directory;
 * a confirmed-different selection or unverifiable identity performs no replacement.
 * @param recovery - Current unavailable-root recovery request exposed by the detecting layer.
 * @returns Explicit reconnect action handler and UI-facing state for the recovery controls.
 */
export const useLocalDirectoryReconnectAction = ({
  recovery,
}: {
  recovery: Ref<FileSystemUnavailableRootRecovery | undefined>;
}) => {
  const { reconnectDirectory } = useFileSystem();
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
          new DomainError('Could not reconnect this folder. Try again from this action.', {
            cause: error,
            code: LocalDirectoryReconnectErrorCode.reconnectFailed,
          }),
          {
            feature: 'localDirectoryRecovery',
            action: 'reconnectFolder',
          },
        );
        if (recovery.value === currentRecovery) {
          reconnectMessageOverride.value =
            'Could not reconnect this folder. Try again from this action.';
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

      reconnectMessageOverride.value =
        result.status === 'mismatch'
          ? 'That folder is different from the one Mioframe remembers. Choose the original folder to reconnect.'
          : result.status === 'identityUnverified'
            ? 'Mioframe could not confirm this is the same folder. Try again from this action.'
            : 'Mioframe no longer remembers this folder.';
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
