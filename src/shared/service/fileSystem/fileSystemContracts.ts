export {
  DEVICE_FILES_ROOT_NAME,
  type DeviceFileDisplayRecord,
} from '@shared/lib/deviceFileSystemProvider';
export type { MioframeSpaceInspection } from '@shared/lib/automergeAdapter';

/**
 * UI-facing options for reading directory content through the shared file-system service.
 */
export interface ReadDirectoryOptions {
  /** Hides Automerge sidecar files from the returned listing. */
  hideAutomergeFiles?: boolean;
}

/**
 * Identifies a specific unavailable-root recovery target for reconnect/relocation calls.
 * `recoveryKey` — not `spaceName` — is the actual target identity: it names one mounted
 * local-directory provider instance and is invalidated when that provider is replaced or
 * removed, even when the mounted name is reused.
 */
export interface DeviceDirectoryRecoveryTarget {
  /** Mounted display/path locator. Display/path data only; never used alone as identity. */
  spaceName: string;
  /** Opaque runtime key identifying the mounted provider instance that emitted the recovery. */
  recoveryKey: string;
}

/**
 * Stable service-local error codes for the fileSystem service boundary.
 */
export enum FileSystemServiceErrorCode {
  /** Canonical Mioframe-space marker inspection failed unexpectedly. */
  markerInspectionFailed = 'fileSystem.markerInspectionFailed',
}

/**
 * Explicit outcome of a remembered local-directory root safe reconnect attempt.
 * - `reconnected` — `isSameEntry()` confirmed identity; the persisted handle was replaced, the
 *   mounted provider now uses it, and repository write-recovery settlement fully flushed (or no
 *   repository was cached).
 * - `reconnectedWithWriteRecoveryFailure` — same-entry provider replacement completed, but
 *   repository write-recovery settlement did not fully flush. The new provider stays mounted;
 *   this is a successful rebind with an explicit pending-write warning, not a rollback signal.
 * - `confirmationRequired` — locator equality was false or could not be established, and the
 *   selected candidate contains the canonical Mioframe marker; no persistence, runtime, registry,
 *   or display mutation occurred.
 * - `invalidCandidate` — locator equality was false or could not be established, and the selected
 *   candidate does not contain the canonical Mioframe marker; zero mutation.
 * - `staleRecovery` — the supplied `{ spaceName, recoveryKey }` no longer identifies the current
 *   mounted provider (it was replaced or removed); zero mutation.
 * - `missingRecord` — no persisted record exists for the given mounted `spaceName`.
 */
export type ReconnectDeviceDirectoryResult =
  | { status: 'reconnected'; name: string }
  | { status: 'reconnectedWithWriteRecoveryFailure'; name: string }
  | { status: 'confirmationRequired' }
  | { status: 'invalidCandidate' }
  | { status: 'staleRecovery' }
  | { status: 'missingRecord' };

/**
 * Explicit outcome of a user-confirmed locator-different remembered local-directory relocation.
 * - `relocated` — the target remembered record was moved to a new mounted identity: the
 *   selected handle is now mounted under `name`, which always differs from the old mounted name.
 *   The old mounted path no longer routes to any physical directory.
 * - `alreadyMounted` — the selected physical directory is already represented by another
 *   persisted mount named `name`; zero persistence, runtime, registry, or display mutation
 *   occurred.
 * - `invalidCandidate` — the canonical Mioframe marker was no longer present on the selected
 *   candidate when revalidated after confirmation; zero mutation.
 * - `staleRecovery` — the supplied `{ spaceName, recoveryKey }` no longer identifies the current
 *   mounted provider when revalidated before mutation; zero mutation.
 * - `missingRecord` — the remembered record disappeared before relocation; no new mount was created.
 */
export type RelocateRememberedDeviceDirectoryResult =
  | { status: 'relocated'; name: string }
  | { status: 'alreadyMounted'; name: string }
  | { status: 'invalidCandidate' }
  | { status: 'staleRecovery' }
  | { status: 'missingRecord' };
