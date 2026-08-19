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
 * Explicit outcome of a remembered local-directory root reconnect attempt.
 * - `reconnected` — the persisted handle was replaced and the mounted provider now uses it.
 * - `missingRecord` — no persisted record exists for the given mounted `spaceName`.
 * - `mismatch` — the selected directory is confirmed to differ from the remembered one.
 * - `identityUnverified` — entry identity could not be confirmed; no replacement was made.
 */
export type ReconnectDeviceDirectoryResult =
  | { status: 'reconnected'; name: string }
  | { status: 'missingRecord' }
  | { status: 'mismatch' }
  | { status: 'identityUnverified' };
