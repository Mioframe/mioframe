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
 * - `reconnected` — `isSameEntry()` confirmed identity; the persisted handle was replaced and
 *   the mounted provider now uses it.
 * - `confirmationRequired` — locator equality was false or could not be established; no
 *   persistence, runtime, registry, or display mutation occurred.
 * - `missingRecord` — no persisted record exists for the given mounted `spaceName`.
 */
export type ReconnectDeviceDirectoryResult =
  | { status: 'reconnected'; name: string }
  | { status: 'confirmationRequired' }
  | { status: 'missingRecord' };

/**
 * Explicit outcome of a user-confirmed remembered local-directory root replacement.
 * - `reconnected` — the persisted handle was replaced and the mounted provider now uses it.
 * - `missingRecord` — the remembered record disappeared before replacement; no new mount was created.
 */
export type ReplaceRememberedDeviceDirectoryResult =
  | { status: 'reconnected'; name: string }
  | { status: 'missingRecord' };
