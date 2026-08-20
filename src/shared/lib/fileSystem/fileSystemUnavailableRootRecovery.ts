import { WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE } from '@shared/lib/webFileSystemProvider';
import type { output } from 'zod/v4-mini';
import { literal, object, string } from 'zod/v4-mini';
import { zodSafeCheck } from '@shared/lib/validateZodScheme';

/**
 * Transfer-safe key for a remembered local-directory root that needs reconnecting.
 * Does not include handles, provider objects, raw browser errors, or raw paths.
 */
export interface FileSystemUnavailableRootRecovery {
  /** Safe remembered-space name shown to the user. */
  spaceName: string;
  /**
   * Opaque, transfer-safe, runtime-only key identifying the mounted provider instance that
   * emitted this recovery. Use this, not `spaceName`, as reconnect target identity.
   */
  recoveryKey: string;
}

const zodSerializedFileSystemUnavailableRootRecoveryPayload = object({
  code: literal(WEB_FILE_SYSTEM_UNAVAILABLE_ROOT_CODE),
  spaceName: string(),
  recoveryKey: string(),
});

type SerializedFileSystemUnavailableRootRecoveryPayload = output<
  typeof zodSerializedFileSystemUnavailableRootRecoveryPayload
>;

const toFileSystemUnavailableRootRecovery = ({
  spaceName,
  recoveryKey,
}: SerializedFileSystemUnavailableRootRecoveryPayload): FileSystemUnavailableRootRecovery => ({
  spaceName,
  recoveryKey,
});

/**
 * Parses a transfer-safe unavailable-root recovery payload from an unknown error shape.
 * @param error - Unknown error candidate emitted by a file-system operation.
 * @returns Recovery state when the payload is valid, otherwise undefined.
 */
export const parseFileSystemUnavailableRootRecovery = (
  error: unknown,
): FileSystemUnavailableRootRecovery | undefined => {
  const result = zodSafeCheck(zodSerializedFileSystemUnavailableRootRecoveryPayload, error);

  if ('error' in result) {
    return undefined;
  }

  return toFileSystemUnavailableRootRecovery(result.data);
};
