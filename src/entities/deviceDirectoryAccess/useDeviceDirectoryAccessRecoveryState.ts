import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE,
  DeviceDirectoryAccessRequiredError,
} from '@shared/service/fileSystem';

/**
 * Transport-safe access-required error shape used by the repo path recovery UI.
 */
type DeviceDirectoryAccessRecoveryErrorLike = Error & {
  code: typeof DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE;
  mode: 'readwrite';
  requestId: string;
  spaceName: string;
};

/**
 * Returns whether the error payload matches the local-space access-recovery contract.
 * @param error - Error candidate emitted by file-system queries.
 * @returns Whether the error matches the remembered local-space access contract.
 */
const isDeviceDirectoryAccessRecoveryError = (
  error: unknown,
): error is DeviceDirectoryAccessRecoveryErrorLike =>
  error instanceof Error &&
  'code' in error &&
  error.code === DEVICE_DIRECTORY_ACCESS_REQUIRED_CODE &&
  'requestId' in error &&
  typeof error.requestId === 'string' &&
  'spaceName' in error &&
  typeof error.spaceName === 'string' &&
  'mode' in error &&
  error.mode === 'readwrite';

/**
 * Finds the first access-required error emitted for a remembered local space.
 * @param errors - Query errors collected for the current repo path.
 * @returns The first matching access-required error, if present.
 */
export const getDeviceDirectoryAccessRecoveryError = (errors: unknown[]) => {
  for (const error of errors) {
    if (
      error instanceof DeviceDirectoryAccessRequiredError ||
      isDeviceDirectoryAccessRecoveryError(error)
    ) {
      return error;
    }
  }

  return undefined;
};

/**
 * Derives typed recovery state for remembered local-space permission prompts.
 * @param options - Reactive error sources for the current repo path.
 * @returns Reactive access-recovery state for the current repo path.
 */
export const useDeviceDirectoryAccessRecoveryState = ({
  errors,
}: {
  errors: MaybeRefOrGetter<unknown[]>;
}) => {
  /**
   * Current recovery payload for the active repo path, if one exists.
   */
  const state = computed(() => {
    const error = getDeviceDirectoryAccessRecoveryError(toValue(errors));

    if (!error) {
      return undefined;
    }

    return {
      mode: error.mode,
      requestId: error.requestId,
      spaceName: error.spaceName,
    };
  });

  return {
    state,
  };
};
