import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import type { ComputedRef } from 'vue';
import { computed, readonly, ref, watch } from 'vue';

/**
 * Tracks write-access recovery state for a VFS activity stream.
 *
 * Owns:
 * - whether a pending access request exists in the registry;
 * - whether a storage failure occurred after a grant attempt;
 * - derived `hasWriteAccessRecovery` and `isStaleWriteAccessRequest` flags.
 *
 * Does not own UI state (showErrorDetails, loading) or snackbar actions.
 * @param state - Reactive VFS activity state from `useVfsActivity`.
 * @returns Recovery state flags and actions for the write-access flow.
 */
export const useWriteAccessRecoveryState = (state: ComputedRef<VfsActivityState>) => {
  const {
    fileSystem: { getFileSystemAccessRequest },
  } = useMainServiceClient();

  const pendingRequestExists = ref<boolean | null>(null);
  const storageFailureAfterGrant = ref(false);
  let checkSequence = 0;

  const writeAccessRecovery = computed(() =>
    getFileSystemAccessRecovery(state.value.lastError?.cause, { operation: 'write' }),
  );

  /** True only when recovery cause exists, a pending request is confirmed, and no post-grant storage failure. */
  const hasWriteAccessRecovery = computed(
    () =>
      !!writeAccessRecovery.value &&
      pendingRequestExists.value === true &&
      !storageFailureAfterGrant.value,
  );

  /** True when recovery cause is present but the request has already been consumed or is missing. */
  const isStaleWriteAccessRequest = computed(
    () =>
      !!writeAccessRecovery.value &&
      pendingRequestExists.value === false &&
      !storageFailureAfterGrant.value,
  );

  const checkPendingRequest = async (): Promise<void> => {
    const recovery = writeAccessRecovery.value;

    if (!recovery) {
      pendingRequestExists.value = null;
      return;
    }

    const sequence = ++checkSequence;

    const result = await getFileSystemAccessRequest({
      operation: recovery.operation,
      spaceName: recovery.spaceName,
    });

    if (sequence !== checkSequence) return;

    pendingRequestExists.value = !!result;
  };

  watch(
    writeAccessRecovery,
    (recovery) => {
      if (!recovery) {
        pendingRequestExists.value = null;
        storageFailureAfterGrant.value = false;
      } else {
        void checkPendingRequest();
      }
    },
    { immediate: true },
  );

  /** Call after a grant attempt results in a non-retriable storage failure. */
  const markStorageFailureAfterGrant = (): void => {
    storageFailureAfterGrant.value = true;
  };

  return {
    writeAccessRecovery,
    hasWriteAccessRecovery,
    isStaleWriteAccessRequest,
    /** Read-only view; mutate only via `markStorageFailureAfterGrant`. */
    storageFailureAfterGrant: readonly(storageFailureAfterGrant),
    checkPendingRequest,
    markStorageFailureAfterGrant,
  };
};
