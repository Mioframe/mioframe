export {
  DEVICE_FILES_ROOT_NAME,
  type DeviceFileDisplayRecord,
} from '@shared/lib/deviceFileSystemProvider';

/**
 * UI-facing options for reading directory content through the shared file-system service.
 */
export interface ReadDirectoryOptions {
  /** Hides Automerge sidecar files from the returned listing. */
  hideAutomergeFiles?: boolean;
}

/**
 * Explicit outcome of a remembered local-directory root safe reconnect attempt.
 * - `reconnected` — `isSameEntry()` confirmed identity; the persisted handle was replaced, the
 *   mounted provider now uses it, and repository write-recovery settlement fully flushed (or no
 *   repository was cached).
 * - `reconnectedWithWriteRecoveryFailure` — same-entry provider replacement completed, but
 *   repository write-recovery settlement did not fully flush. The new provider stays mounted;
 *   this is a successful rebind with an explicit pending-write warning, not a rollback signal.
 * - `confirmationRequired` — locator equality was false or could not be established; no
 *   persistence, runtime, registry, or display mutation occurred.
 * - `missingRecord` — no persisted record exists for the given mounted `spaceName`.
 */
export type ReconnectDeviceDirectoryResult =
  | { status: 'reconnected'; name: string }
  | { status: 'reconnectedWithWriteRecoveryFailure'; name: string }
  | { status: 'confirmationRequired' }
  | { status: 'missingRecord' };

/**
 * Explicit outcome of a user-confirmed locator-different remembered local-directory relocation.
 * - `relocated` — the target remembered record was moved to a new mounted identity: the
 *   selected handle is now mounted under `name`, which always differs from the old mounted name.
 *   The old mounted path no longer routes to any physical directory.
 * - `alreadyMounted` — the selected physical directory is already represented by another
 *   persisted mount named `name`; zero persistence, runtime, registry, or display mutation
 *   occurred.
 * - `missingRecord` — the remembered record disappeared before relocation; no new mount was created.
 */
export type RelocateRememberedDeviceDirectoryResult =
  | { status: 'relocated'; name: string }
  | { status: 'alreadyMounted'; name: string }
  | { status: 'missingRecord' };
